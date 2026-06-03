'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Icon } from '@iconify/react';
import {
  Shield, Plus, Search, ChevronDown, ChevronRight,
  CheckCircle2, Loader2, ShieldCheck, ListChecks, Edit3,
} from 'lucide-react';
import {
  Button, Card, Input, Label, Badge,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  ErrorMessage,
} from '@/components/ui';
import { MainLayout } from '@/components/layout/main-layout';
import { toast } from 'sonner';
import { useAppSelector } from '@/store';
import { IRole, IPermission, IPermissionCategory } from '@/features/roles/roles.schemas';
import ProtectedComponent from '@/components/permissions/protectedcomponent';
import { PERMISSION_CODES } from '@/codes';
import {
  FetchRoles,
  FetchPermissions,
  CreateRole,
  UpdateRole,
  DeleteRole,
  AssignRolePermissions,
} from '@/features/roles/roles.service';

// ── Helpers ────────────────────────────────────────────────────────────────────
function groupByCategory(perms: IPermission[]) {
  const map: Record<string, { cat: IPermissionCategory; perms: IPermission[] }> = {};
  for (const p of perms) {
    const k = p.category.code;
    if (!map[k]) map[k] = { cat: p.category, perms: [] };
    map[k].perms.push(p);
  }
  return Object.values(map).sort((a, b) => a.cat.name.localeCompare(b.cat.name));
}

// ── Permission Panel ───────────────────────────────────────────────────────────
function PermissionPanel({ role, allPermissions, onSaved }: {
  role: IRole; allPermissions: IPermission[]; onSaved: (r: IRole) => void;
}) {
  const [tab, setTab] = useState<'assign' | 'assigned'>('assign');
  const [selected, setSelected] = useState<Set<number>>(new Set(role.permissions.map(p => p.id)));
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    setSelected(new Set(role.permissions.map(p => p.id)));
    setSearch('');
    setTab('assign');
  }, [role.id]);

  const filtered = allPermissions.filter(p =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase())
  );
  const grouped = groupByCategory(filtered);

  const toggle = (id: number) => setSelected(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });
  const toggleCat = (code: string) => setExpanded(prev => {
    const n = new Set(prev); n.has(code) ? n.delete(code) : n.add(code); return n;
  });
  const selectAllInCat = (perms: IPermission[], on: boolean) => setSelected(prev => {
    const n = new Set(prev); perms.forEach(p => on ? n.add(p.id!) : n.delete(p.id!)); return n;
  });
  const allSel = selected.size === allPermissions.length;

  const handleSave = async () => {
    setSaving(true);
    const result = await AssignRolePermissions(role.id, [...selected]);
    if (result.success) {
      toast.success(`Permissions saved for "${role.name}"`);
      onSaved(result.data!);
    } else {
      toast.error('Failed to save permissions');
    }
    setSaving(false);
  };

  const assignedGrouped = groupByCategory(
    allPermissions.filter(p => role.permissions.some(rp => rp.id === p.id))
  );

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex gap-1 mb-4 bg-gray-50 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('assign')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === 'assign' ? 'bg-white text-primary ' : 'text-gray-500 hover:text-My-Black'}`}
        >
          <Edit3 className="w-3.5 h-3.5" /> Assign Permissions
        </button>
        <button
          onClick={() => setTab('assigned')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === 'assigned' ? 'bg-white text-primary ' : 'text-gray-500 hover:text-My-Black'}`}
        >
          <ListChecks className="w-3.5 h-3.5" />
          Assigned
          <span className="ml-1 bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[9px] font-black">
            {role.permissions.length}
          </span>
        </button>
      </div>

      {tab === 'assigned' ? (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {role.permissions.length === 0 ? (
            <div className="py-16 text-center text-My-Black">
              <Shield className="w-8 h-8 mx-auto text-My-Black mb-2" />
              <p className="text-sm font-medium">No permissions assigned yet</p>
              <p className="text-xs mt-1">Switch to "Assign Permissions" to add some.</p>
            </div>
          ) : assignedGrouped.map(({ cat, perms }) => (
            <div key={cat.code} className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/10">
                <ShieldCheck className="w-3.5 h-3.5 text-primary/70" />
                <span className="text-xs font-bold text-primary">{cat.name}</span>
                <span className="ml-auto text-[10px] text-primary/70 font-medium">{perms.length}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {perms.map(p => (
                  <div key={p.id} className="flex items-start gap-3 px-4 py-2.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{p.name}</p>
                      {p.description && <p className="text-[10px] text-My-Black mt-0.5">{p.description}</p>}
                      <p className="text-[10px] font-mono text-My-Black mt-0.5">{p.code}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-xs font-black text-My-Black uppercase tracking-widest">
              {selected.size} / {allPermissions.length} selected
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg"
                onClick={() => setSelected(allSel ? new Set() : new Set(allPermissions.map(p => p.id!)))}>
                {allSel ? 'Deselect All' : 'Select All'}
              </Button>
              <Button size="sm" disabled={saving} onClick={handleSave} className="h-7 text-[10px] rounded-lg gap-1">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                Save
              </Button>
            </div>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-My-Black" />
            <Input placeholder="Search permissions…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs rounded-lg border-gray-200" />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {grouped.map(({ cat, perms }) => {
              const numSel = perms.filter(p => selected.has(p.id!)).length;
              const catAll = numSel === perms.length;
              const catSome = numSel > 0 && !catAll;
              const isOpen = expanded.has(cat.code);
              return (
                <div key={cat.code} className="border border-gray-100 rounded-xl overflow-hidden">
                  <button className="w-full flex items-center gap-2 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
                    onClick={() => toggleCat(cat.code)}>
                    <span className="text-My-Black">
                      {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </span>
                    <input type="checkbox" checked={catAll}
                      ref={el => { if (el) el.indeterminate = catSome; }}
                      onChange={e => { e.stopPropagation(); selectAllInCat(perms, e.target.checked); }}
                      onClick={e => e.stopPropagation()}
                      className="rounded border-gray-300 text-primary w-3.5 h-3.5 cursor-pointer" />
                    <span className="text-xs font-bold text-My-Black flex-1 text-left">{cat.name}</span>
                    <span className="text-[10px] text-My-Black font-medium">{numSel}/{perms.length}</span>
                  </button>
                  {isOpen && (
                    <div className="divide-y divide-gray-50">
                      {perms.map(perm => (
                        <label key={perm.id}
                          className="flex items-start gap-3 px-4 py-2.5 hover:bg-primary/10 cursor-pointer transition-colors">
                          <input type="checkbox" checked={selected.has(perm.id!)}
                            onChange={() => toggle(perm.id!)}
                            className="mt-0.5 rounded border-gray-300 text-primary w-3.5 h-3.5 cursor-pointer" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 leading-tight">{perm.name}</p>
                            {perm.description && <p className="text-[10px] text-My-Black mt-0.5 leading-tight">{perm.description}</p>}
                            <p className="text-[10px] font-mono text-My-Black mt-0.5">{perm.code}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Role Form Dialog ───────────────────────────────────────────────────────────
function RoleFormDialog({ open, onClose, initial, onSaved }: {
  open: boolean; onClose: () => void; initial?: IRole | null; onSaved: (r: IRole) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const school = useAppSelector(state => state.auth.school);

  useEffect(() => {
    setName(initial?.name ?? '');
    setDescription(initial?.description ?? '');
    setError('');
  }, [initial, open]);

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Role name is required'); return; }
    setLoading(true);
    const result = initial
      ? await UpdateRole(initial.id, { name: name.trim(), description: description.trim() || undefined, school: school?.id })
      : await CreateRole({ name: name.trim(), description: description.trim() || undefined, school: school?.id });

    if (result.success) {
      toast.success(initial ? 'Role updated' : 'Role created');
      onSaved(result.data!);
      onClose();
    } else {
      toast.error('Failed to save role');
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">{initial ? 'Edit Role' : 'New Role'}</DialogTitle>
          <DialogDescription className="text-My-Black text-sm">
            {initial ? 'Update name or description.' : 'Create a role, then assign permissions.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-My-Black uppercase tracking-widest">Role Name *</Label>
            <Input value={name} onChange={e => { setName(e.target.value); setError(''); }}
              placeholder="e.g. Class Teacher" className="h-11 rounded-xl border-gray-200" autoFocus />
            {error && <ErrorMessage message={error} />}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-My-Black uppercase tracking-widest">Description</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Optional…" className="h-11 rounded-xl border-gray-200" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="rounded-xl gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {initial ? 'Save Changes' : 'Create Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function RolesPage() {
  const [roles, setRoles] = useState<IRole[]>([]);
  const [allPermissions, setAllPermissions] = useState<IPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<IRole | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<IRole | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        FetchRoles({ page_size: 200 }),
        FetchPermissions({ page_size: 500 }),
      ]);
      const rolesData = 'error' in rolesRes ? [] : (rolesRes.results ?? []);
      const permsData = 'error' in permsRes ? [] : (permsRes.results ?? []);
      setRoles(rolesData);
      setAllPermissions(permsData);
      if (rolesData.length > 0) setSelectedRole(r => r ?? rolesData[0]);
    } catch {
      toast.error('Failed to load data');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = roles.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (role: IRole) => {
    if (!confirm(`Delete role "${role.name}"?`)) return;
    setDeleting(role.id);
    const result = await DeleteRole(role.id);
    if (result.success) {
      toast.success('Role deleted');
      setRoles(prev => prev.filter(r => r.id !== role.id));
      if (selectedRole?.id === role.id) setSelectedRole(roles.find(r => r.id !== role.id) ?? null);
    } else {
      toast.error('Failed to delete role');
    }
    setDeleting(null);
  };

  const handleRoleSaved = (role: IRole) => {
    setRoles(prev => {
      const idx = prev.findIndex(r => r.id === role.id);
      return idx >= 0 ? prev.map(r => r.id === role.id ? role : r) : [...prev, role];
    });
    setSelectedRole(role);
  };

  const handlePermSaved = (updated: IRole) => {
    setRoles(prev => prev.map(r => r.id === updated.id ? updated : r));
    setSelectedRole(updated);
  };

  return (
    <ProtectedComponent permissionCode={PERMISSION_CODES.VIEW_ROLES}>
      <MainLayout
        title="Roles & Permissions"
        description="Manage roles and their access permissions."
        headerActions={
          <Button className="rounded-xl h-11 bg-white text-primary hover:bg-gray-100 font-bold px-6 border border-transparent"
            onClick={() => { setEditingRole(null); setFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> New Role
          </Button>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ minHeight: '70vh' }}>
          {/* ── Left: Role list ── */}
          <Card className="h-[450px] lg:h-auto border-none -none ring-1 ring-gray-100 bg-white flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-My-Black" />
                <Input placeholder="Search roles…" value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-9 rounded-xl border-gray-200 text-sm" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 animate-pulse space-y-1.5">
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                    <div className="h-3 bg-gray-50 rounded w-3/4" />
                  </div>
                ))
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center text-My-Black space-y-2">
                  <Shield className="w-8 h-8 mx-auto text-My-Black" />
                  <p className="text-sm font-medium">No roles found</p>
                </div>
              ) : filtered.map(role => (
                <button key={role.id} onClick={() => setSelectedRole(role)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-primary/5 ${selectedRole?.id === role.id ? 'bg-primary/10 border-l-2 border-primary' : ''}`}>
                  <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${role.is_superadmin ? 'bg-gray-100 text-My-Black' : 'bg-primary/10 text-primary'}`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-bold text-My-Black truncate">{role.name}</p>
                      {role.is_superadmin && (
                        <Badge className="text-[9px] px-1.5 py-0 bg-gray-100 text-My-Black border-none rounded-full font-black">SUPER</Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-My-Black mt-0.5 truncate">{role.description || 'No description'}</p>
                    <p className="text-[10px] font-bold text-primary/70 mt-0.5">{role.permissions.length} permissions</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                      <button className="p-1 rounded-lg hover:bg-gray-100 text-My-Black hover:text-My-Black flex-shrink-0">
                        <Icon icon="hugeicons:more-vertical-circle-01" className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 rounded-xl border-gray-100">
                      <DropdownMenuItem className="cursor-pointer py-2 text-sm"
                        onClick={e => { e.stopPropagation(); setEditingRole(role); setFormOpen(true); }}>
                        <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      {!role.is_superadmin && (
                        <DropdownMenuItem className="cursor-pointer py-2 text-sm text-rose-600 focus:text-rose-600"
                          onClick={e => { e.stopPropagation(); handleDelete(role); }}
                          disabled={deleting === role.id}>
                          {deleting === role.id
                            ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            : <Icon icon="hugeicons:delete-02" className="w-4 h-4 mr-2" />}
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </button>
              ))}
            </div>
          </Card>

          {/* ── Right: Permission panel ── */}
          <Card className="lg:col-span-2 h-[550px] lg:h-auto border-none -none ring-1 ring-gray-100 bg-white flex flex-col overflow-hidden">
            {selectedRole ? (
              <>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${selectedRole.is_superadmin ? 'bg-gray-100' : 'bg-primary/10'}`}>
                    <ShieldCheck className={`w-5 h-5 ${selectedRole.is_superadmin ? 'text-My-Black' : 'text-primary'}`} />
                  </div>
                  <div>
                    <h2 className="font-black text-My-Black text-lg leading-none">{selectedRole.name}</h2>
                    <p className="text-xs text-My-Black mt-0.5">{selectedRole.description || 'No description'}</p>
                  </div>
                  {selectedRole.is_superadmin && (
                    <Badge className="ml-auto bg-gray-100 text-My-Black border-none font-black text-xs rounded-full px-3">
                      SuperAdmin · All permissions
                    </Badge>
                  )}
                </div>
                <div className="flex-1 overflow-hidden p-5">
                  {selectedRole.is_superadmin ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4 text-center text-My-Black">
                      <ShieldCheck className="w-16 h-16 text-My-Black" />
                      <div>
                        <p className="font-black text-My-Black text-lg">Super Admin Role</p>
                        <p className="text-sm mt-1">This role automatically has <strong>all permissions</strong>.</p>
                      </div>
                    </div>
                  ) : (
                    <PermissionPanel key={selectedRole.id} role={selectedRole}
                      allPermissions={allPermissions} onSaved={handlePermSaved} />
                  )}
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-center text-My-Black p-8">
                <Shield className="w-16 h-16 text-gray-100" />
                <div>
                  <p className="font-black text-My-Black text-lg">Select a Role</p>
                  <p className="text-sm mt-1">Choose a role to manage its permissions.</p>
                </div>
              </div>
            )}
          </Card>
        </div>

        <RoleFormDialog open={formOpen} onClose={() => setFormOpen(false)}
          initial={editingRole} onSaved={handleRoleSaved} />
      </MainLayout>
    </ProtectedComponent>
  );
}
