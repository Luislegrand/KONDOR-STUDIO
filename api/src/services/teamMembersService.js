// Arquivo atualizado: api/src/services/teamMembersService.js
const { prisma } = require('../prisma');
const { hashPassword } = require('../utils/hash');

function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

function mapRoleToFrontend(userRole) {
  if (!userRole) return 'member';
  if (userRole === 'OWNER' || userRole === 'ADMIN') return 'admin';
  return 'member';
}

function mapRoleToPrisma(role) {
  if (!role) return 'MEMBER';
  const normalized = String(role).toLowerCase();
  if (normalized === 'admin') return 'ADMIN';
  return 'MEMBER';
}

function buildPermissionsFromRole(userRole) {
  const isAdmin = userRole === 'OWNER' || userRole === 'ADMIN';
  return {
    clients: true,
    posts: true,
    approvals: true,
    tasks: true,
    metrics: isAdmin,
    team: isAdmin,
    settings: isAdmin,
  };
}

function mapTeamMemberToDto(member) {
  if (!member) return null;
  const user = member.user || {};
  const roleEnum = user.role || member.role || 'MEMBER';

  return {
    id: member.id,
    tenant_id: member.tenantId,
    team_id: member.teamId,
    user_id: member.userId,
    name: user.name || user.email,
    email: user.email,
    role: mapRoleToFrontend(roleEnum),
    status: user.isActive ? 'active' : 'suspended',
    avatar_url: user.avatarUrl || null,
    permissions: member.permissions || buildPermissionsFromRole(roleEnum),
    _raw: {
      teamMember: {
        id: member.id,
        role: member.role,
        createdAt: member.createdAt,
      },
      user: {
        id: user.id,
        role: user.role,
        isActive: user.isActive,
        passwordHash: user.passwordHash,
      },
      team: member.team ? { id: member.team.id, name: member.team.name } : null,
    },
  };
}

async function getOrCreateDefaultTeam(tenantId) {
  let team = await prisma.team.findFirst({ where: { tenantId } });
  if (!team) {
    team = await prisma.team.create({
      data: {
        tenantId,
        name: 'Equipe Principal',
      },
    });
  }
  return team;
}

async function findOrCreateUserForTeam(tenantId, data) {
  const email = data.email;
  if (!email) throw new Error('Email é obrigatório para criar membro');

  let user = await prisma.user.findFirst({ where: { tenantId, email } });
  const prismaRole = mapRoleToPrisma(data.role);

  if (!user) {
    user = await prisma.user.create({
      data: {
        tenantId,
        email,
        name: data.name || null,
        role: prismaRole,
        isActive: data.status === 'suspended' ? false : true,
        passwordHash: data.passwordHash || null,
      },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: data.name || user.name,
        role: prismaRole,
        isActive:
          data.status === 'suspended'
            ? false
            : data.status === 'active'
            ? true
            : user.isActive,
      },
    });
  }

  return user;
}

module.exports = {
  async list(tenantId, filters = {}) {
    const { search, role, status, limit = 50, page = 1 } = filters;
    const where = { tenantId };
    const prismaRole = role ? mapRoleToPrisma(role) : null;
    if (prismaRole) where.role = prismaRole;

    const userFilter = {};
    if (status === 'active') userFilter.isActive = true;
    else if (status === 'suspended') userFilter.isActive = false;

    if (search) {
      userFilter.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const members = await prisma.teamMember.findMany({
      where: {
        ...where,
        user: Object.keys(userFilter).length ? userFilter : undefined,
      },
      include: { user: true, team: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return members.map(mapTeamMemberToDto);
  },

  async suggest(tenantId, { search, limit = 10 } = {}) {
    const where = { tenantId };
    const userFilter = {};
    if (search) {
      userFilter.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const members = await prisma.teamMember.findMany({
      where: {
        ...where,
        user: Object.keys(userFilter).length ? userFilter : undefined,
      },
      include: { user: true, team: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return members.map(mapTeamMemberToDto);
  },

  async create(tenantId, data = {}) {
    const team = await getOrCreateDefaultTeam(tenantId);
    const user = await findOrCreateUserForTeam(tenantId, data);

    const existing = await prisma.teamMember.findFirst({
      where: { tenantId, teamId: team.id, userId: user.id },
      include: { user: true, team: true },
    });
    if (existing) return mapTeamMemberToDto(existing);

    const prismaRole = mapRoleToPrisma(data.role);
    const permissions = data.permissions || buildPermissionsFromRole(prismaRole);

    const created = await prisma.teamMember.create({
      data: {
        tenantId,
        teamId: team.id,
        userId: user.id,
        role: prismaRole,
        permissions,
      },
      include: { user: true, team: true },
    });

    return mapTeamMemberToDto(created);
  },

  async getById(tenantId, id) {
    const member = await prisma.teamMember.findFirst({
      where: { id, tenantId },
      include: { user: true, team: true },
    });
    if (!member) return null;
    return mapTeamMemberToDto(member);
  },

  async update(tenantId, id, data = {}) {
    const existing = await prisma.teamMember.findFirst({
      where: { id, tenantId },
      include: { user: true, team: true },
    });
    if (!existing) return null;

    const prismaRole = data.role ? mapRoleToPrisma(data.role) : existing.role;
    const permissions = data.permissions || existing.permissions;

    await prisma.user.update({
      where: { id: existing.userId },
      data: {
        name: data.name || existing.user.name,
        role: prismaRole,
        isActive:
          data.status === 'suspended'
            ? false
            : data.status === 'active'
            ? true
            : existing.user.isActive,
      },
    });

    const updatedMember = await prisma.teamMember.update({
      where: { id: existing.id },
      data: {
        role: prismaRole,
        permissions,
      },
      include: { user: true, team: true },
    });

    return mapTeamMemberToDto(updatedMember);
  },

  async assignRoles(tenantId, id, roles) {
    const member = await prisma.teamMember.findFirst({ where: { id, tenantId } });
    if (!member) return null;

    const updated = await prisma.teamMember.update({
      where: { id },
      data: {
        permissions: {
          ...member.permissions,
          extraRoles: toArray(roles),
        },
      },
    });

    return this.getById(tenantId, id);
  },

  async remove(tenantId, id, options = {}) {
    const { soft = true } = options;
    const existing = await prisma.teamMember.findFirst({
      where: { id, tenantId },
      include: { user: true },
    });
    if (!existing) return false;

    if (soft) {
      await prisma.user.update({
        where: { id: existing.userId },
        data: { isActive: false },
      });
      return true;
    }

    await prisma.teamMember.delete({ where: { id: existing.id } });
    return true;
  },

  async sendInvite(tenantId, id) {
    const member = await prisma.teamMember.findFirst({
      where: { id, tenantId },
      include: { user: true },
    });
    if (!member) return null;

    const tempPassword = Math.random().toString(36).slice(-8);
    const hashed = await hashPassword(tempPassword);

    await prisma.user.update({
      where: { id: member.userId },
      data: {
        passwordHash: hashed,
        isActive: true,
      },
    });

    return { tempPassword };
  },
};