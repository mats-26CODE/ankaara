"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";

import { ProfileAvatar } from "@/components/shared/profile-avatar";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useBusinesses } from "@/hooks/use-businesses";
import { useEffectiveSubscription } from "@/hooks/use-effective-subscription";
import { getPlanTier } from "@/hooks/use-subscription-plans";
import { useStaffPermissions } from "@/hooks/use-staff-permissions";
import {
  STAFF_PAGE_SIZE,
  useBusinessStaff,
  useInviteStaff,
  useStaffCategories,
  useUpdateBusinessStaff,
  useUpdateStaffMember,
  type BusinessStaffRow,
} from "@/hooks/use-staff";
import { useTranslation } from "@/hooks/use-translation";
import { useCurrentBusinessId } from "@/lib/stores/business-store";
import { addCountryCode, clampPhoneDigitInput, formatPhoneForDisplay } from "@/helpers/helpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { getSubscribeUrlForPlanLimit } from "@/lib/subscription-limits";

type InviteForm = {
  business_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  staff_category_id: string;
};

const emptyInviteForm: InviteForm = {
  business_id: "",
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  staff_category_id: "",
};

const getStaffDisplayName = (member: BusinessStaffRow): string => {
  const profile = member.profile;
  return (
    profile?.full_name?.trim() ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    profile?.phone ||
    "Staff member"
  );
};

const formatStaffStatus = (status: BusinessStaffRow["status"]): string =>
  status.charAt(0).toUpperCase() + status.slice(1);

const StaffPage = () => {
  const { t } = useTranslation();
  const { businesses, loading: businessesLoading } = useBusinesses();
  const { currentBusinessId } = useCurrentBusinessId();
  const {
    data: subscription,
    isPlanAccessLoading,
    planInheritedFromBusiness,
  } = useEffectiveSubscription();
  const permissions = useStaffPermissions();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [removingStaff, setRemovingStaff] = useState<BusinessStaffRow | null>(null);
  const [suspendingStaff, setSuspendingStaff] = useState<BusinessStaffRow | null>(null);
  const [editingMember, setEditingMember] = useState<BusinessStaffRow | null>(null);
  const [form, setForm] = useState<InviteForm>(emptyInviteForm);
  const { data: staffPage, isLoading } = useBusinessStaff(
    currentBusinessId,
    page,
    STAFF_PAGE_SIZE,
    debouncedSearch,
  );
  const { data: categories = [] } = useStaffCategories(currentBusinessId);
  const inviteTargetBusinessId = inviteOpen ? form.business_id || currentBusinessId : null;
  const { data: inviteCategories = [] } = useStaffCategories(inviteTargetBusinessId);
  const inviteStaff = useInviteStaff();
  const updateStaff = useUpdateBusinessStaff();
  const updateStaffMember = useUpdateStaffMember();

  const staff = staffPage?.rows ?? [];
  const total = staffPage?.totalCount ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / STAFF_PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * STAFF_PAGE_SIZE + 1;
  const to = Math.min(page * STAFF_PAGE_SIZE, total);

  const activeBusiness = businesses.find((b) => b.id === currentBusinessId);
  const planTier = getPlanTier(subscription?.planSlug ?? "free");
  const hasStaffPlanAccess = planTier === "pro" || planTier === "business";
  const canInviteStaff = hasStaffPlanAccess && permissions.can("staff_management", "manage");
  const canManageStaffRows = hasStaffPlanAccess && permissions.can("staff_management", "manage");

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: category.id, label: category.name })),
    [categories],
  );

  const inviteCategoryOptions = useMemo(
    () => inviteCategories.map((category) => ({ value: category.id, label: category.name })),
    [inviteCategories],
  );

  const businessOptions = useMemo(
    () => businesses.map((business) => ({ value: business.id, label: business.name })),
    [businesses],
  );

  const canSubmitInvite =
    !!form.business_id &&
    !!form.first_name.trim() &&
    !!form.last_name.trim() &&
    !!form.phone.trim() &&
    !!form.staff_category_id;

  const canSubmitEdit =
    !!currentBusinessId &&
    !!editingMember &&
    !!form.first_name.trim() &&
    !!form.last_name.trim() &&
    !!form.phone.trim() &&
    !!form.staff_category_id;

  useEffect(() => {
    setPage(1);
  }, [currentBusinessId, debouncedSearch]);

  useEffect(() => {
    if (page > lastPage) {
      setPage(lastPage);
    }
  }, [page, lastPage]);

  const handleInvite = () => {
    if (!form.business_id || !canSubmitInvite) return;
    inviteStaff.mutate(
      {
        business_id: form.business_id,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: addCountryCode(form.phone.trim()),
        email: form.email.trim() || undefined,
        staff_category_id: form.staff_category_id,
      },
      {
        onSuccess: () => {
          setInviteOpen(false);
          setForm(emptyInviteForm);
          setPage(1);
        },
      },
    );
  };

  const openEditMember = (member: BusinessStaffRow) => {
    const profile = member.profile;
    setEditingMember(member);
    setForm({
      business_id: currentBusinessId ?? "",
      first_name: profile?.first_name?.trim() || profile?.full_name?.split(" ")[0] || "",
      last_name:
        profile?.last_name?.trim() || profile?.full_name?.split(" ").slice(1).join(" ") || "",
      phone: profile?.phone ? clampPhoneDigitInput(formatPhoneForDisplay(profile.phone)) : "",
      email: profile?.email || "",
      staff_category_id: member.staff_category_id,
    });
    setEditOpen(true);
  };

  const handleUpdateMember = () => {
    if (!currentBusinessId || !editingMember || !canSubmitEdit) return;
    updateStaffMember.mutate(
      {
        business_id: currentBusinessId,
        staff_id: editingMember.id,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: addCountryCode(form.phone.trim()),
        email: form.email.trim() || undefined,
        staff_category_id: form.staff_category_id,
      },
      {
        onSuccess: () => {
          setEditOpen(false);
          setEditingMember(null);
          setForm(emptyInviteForm);
        },
      },
    );
  };

  const handleStaffAction = (member: BusinessStaffRow, status: BusinessStaffRow["status"]) => {
    if (!currentBusinessId) return;
    updateStaff.mutate({ id: member.id, business_id: currentBusinessId, status });
  };

  const handleRequestSuspendStaff = (member: BusinessStaffRow) => {
    setSuspendingStaff(member);
    setSuspendDialogOpen(true);
  };

  const handleConfirmSuspendStaff = () => {
    if (!suspendingStaff || !currentBusinessId) return;
    updateStaff.mutate(
      { id: suspendingStaff.id, business_id: currentBusinessId, status: "suspended" },
      {
        onSuccess: () => {
          setSuspendDialogOpen(false);
          setSuspendingStaff(null);
        },
      },
    );
  };

  const handleRequestRemoveStaff = (member: BusinessStaffRow) => {
    setRemovingStaff(member);
    setRemoveDialogOpen(true);
  };

  const handleConfirmRemoveStaff = () => {
    if (!removingStaff || !currentBusinessId) return;
    updateStaff.mutate(
      { id: removingStaff.id, business_id: currentBusinessId, status: "removed" },
      {
        onSuccess: () => {
          setRemoveDialogOpen(false);
          setRemovingStaff(null);
        },
      },
    );
  };

  if (businessesLoading || isPlanAccessLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (!hasStaffPlanAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.nav.staff")}</h1>
          <p className="text-muted-foreground text-sm">
            {activeBusiness?.name
              ? t("dashboard.staff.subtitleWithBusiness", { name: activeBusiness.name })
              : t("dashboard.staff.subtitle")}
          </p>
        </div>
        <Card>
          <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-4 py-12 text-center">
            <Users className="text-muted-foreground size-12" />
            <div className="max-w-md space-y-1">
              <p className="font-medium">{t("dashboard.staff.upgrade.title")}</p>
              <p className="text-muted-foreground text-sm">
                {t("dashboard.staff.upgrade.description")}
              </p>
            </div>
            {planInheritedFromBusiness ? (
              <p className="text-muted-foreground max-w-md text-sm">
                {t("dashboard.common.staffPlanUpgradeHint")}
              </p>
            ) : (
              <Button asChild>
                <Link href={getSubscribeUrlForPlanLimit("PLAN_LIMIT:staff_management")}>
                  {t("dashboard.common.viewPlans")}
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.nav.staff")}</h1>
          <p className="text-muted-foreground text-sm">
            {activeBusiness?.name
              ? t("dashboard.staff.subtitleWithBusiness", { name: activeBusiness.name })
              : t("dashboard.staff.subtitle")}
          </p>
        </div>
        {canInviteStaff ? (
          <Button
            size="sm"
            onClick={() => {
              setForm({
                ...emptyInviteForm,
                business_id: currentBusinessId ?? businesses[0]?.id ?? "",
              });
              setInviteOpen(true);
            }}
            disabled={businesses.length === 0}
          >
            {t("dashboard.staff.invite")}
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("dashboard.staff.searchPlaceholder")}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-6" />
            </div>
          ) : staff.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground text-sm">
                {debouncedSearch.trim()
                  ? t("dashboard.staff.emptyNoMatch")
                  : t("dashboard.staff.emptyNoData")}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("dashboard.common.name")}</TableHead>
                  <TableHead className="hidden sm:table-cell">Role</TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("dashboard.common.phone")}
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    {t("dashboard.common.email")}
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member) => {
                  const profile = member.profile;
                  const name = getStaffDisplayName(member);
                  const phoneDisplay = profile?.phone ? formatPhoneForDisplay(profile.phone) : "—";

                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ProfileAvatar name={name} image={profile?.avatar_url} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-medium">{name}</p>
                            <p className="text-muted-foreground truncate text-xs sm:hidden">
                              {member.staff_categories?.name ?? "Role"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden sm:table-cell">
                        {member.staff_categories?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">
                        {phoneDisplay}
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden lg:table-cell">
                        {profile?.email || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{formatStaffStatus(member.status)}</Badge>
                      </TableCell>
                      <TableCell>
                        {currentBusinessId && canManageStaffRows ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditMember(member)}>
                                <Pencil className="mr-2 size-4" />
                                {t("dashboard.common.edit")}
                              </DropdownMenuItem>
                              {member.status === "active" ? (
                                <DropdownMenuItem
                                  onClick={() => handleRequestSuspendStaff(member)}
                                >
                                  <UserX className="mr-2 size-4" />
                                  Suspend
                                </DropdownMenuItem>
                              ) : member.status === "suspended" ? (
                                <DropdownMenuItem
                                  onClick={() => handleStaffAction(member, "active")}
                                >
                                  <UserCheck className="mr-2 size-4" />
                                  Reactivate
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuItem
                                onClick={() => handleRequestRemoveStaff(member)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 size-4" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          {total > 0 ? (
            <div className="mt-4 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground text-sm">
                {t("dashboard.common.showingRange", { from, to, total })}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoading}
                >
                  <ChevronLeft className="mr-1 size-4" />
                  {t("dashboard.common.previous")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  disabled={page >= lastPage || isLoading}
                >
                  {t("dashboard.common.next")}
                  <ChevronRight className="ml-1 size-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite staff</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            {businessOptions.length > 1 ? (
              <div className="grid w-full gap-2">
                <Label>{t("dashboard.staff.business")}</Label>
                <Select
                  value={form.business_id}
                  onValueChange={(business_id) =>
                    setForm((prev) => ({ ...prev, business_id, staff_category_id: "" }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("dashboard.staff.businessPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {businessOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="first_name">First name</Label>
                <Input
                  id="first_name"
                  value={form.first_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last_name">Last name</Label>
                <Input
                  id="last_name"
                  value={form.last_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, phone: clampPhoneDigitInput(e.target.value) }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="grid w-full gap-2">
              <Label>Role</Label>
              <Select
                value={form.staff_category_id}
                onValueChange={(staff_category_id) =>
                  setForm((prev) => ({ ...prev, staff_category_id }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {inviteCategoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInviteOpen(false)}
              disabled={inviteStaff.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={!canSubmitInvite}
              isLoading={inviteStaff.isPending}
            >
              Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) {
            setEditingMember(null);
            setForm(emptyInviteForm);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dashboard.staff.editTitle")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="edit_first_name">{t("dashboard.staff.firstName")}</Label>
                <Input
                  id="edit_first_name"
                  value={form.first_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_last_name">{t("dashboard.staff.lastName")}</Label>
                <Input
                  id="edit_last_name"
                  value={form.last_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_phone">{t("dashboard.common.phone")}</Label>
              <Input
                id="edit_phone"
                value={form.phone}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, phone: clampPhoneDigitInput(e.target.value) }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_email">{t("dashboard.common.email")}</Label>
              <Input
                id="edit_email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="grid w-full gap-2">
              <Label>{t("dashboard.staff.role")}</Label>
              <Select
                value={form.staff_category_id}
                onValueChange={(staff_category_id) =>
                  setForm((prev) => ({ ...prev, staff_category_id }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("dashboard.staff.rolePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={updateStaffMember.isPending}
            >
              {t("dashboard.common.cancel")}
            </Button>
            <Button
              onClick={handleUpdateMember}
              disabled={!canSubmitEdit}
              isLoading={updateStaffMember.isPending}
            >
              {t("dashboard.common.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={suspendDialogOpen}
        onOpenChange={(open) => {
          setSuspendDialogOpen(open);
          if (!open) setSuspendingStaff(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dashboard.staff.suspendTitle")}</DialogTitle>
            <DialogDescription>
              {t("dashboard.staff.suspendDescription", {
                name: suspendingStaff ? getStaffDisplayName(suspendingStaff) : "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSuspendDialogOpen(false)}
              disabled={updateStaff.isPending}
            >
              {t("dashboard.common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmSuspendStaff}
              disabled={updateStaff.isPending}
              isLoading={updateStaff.isPending}
            >
              {t("dashboard.staff.suspendConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={removeDialogOpen}
        onOpenChange={(open) => {
          setRemoveDialogOpen(open);
          if (!open) setRemovingStaff(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dashboard.staff.removeTitle")}</DialogTitle>
            <DialogDescription>
              {t("dashboard.staff.removeDescription", {
                name: removingStaff ? getStaffDisplayName(removingStaff) : "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveDialogOpen(false)}
              disabled={updateStaff.isPending}
            >
              {t("dashboard.common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmRemoveStaff}
              disabled={updateStaff.isPending}
              isLoading={updateStaff.isPending}
            >
              {t("dashboard.common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffPage;
