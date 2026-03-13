"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDeleteModal } from "@/app/components/ConfirmDeleteModal";
import EmployeesTable from "./EmployeesTable";
import EmployeesToolbar from "./EmployeesToolbar";
import EmployeesFilters from "./EmployeesFilters";
import EmployeeModal from "./EmployeeModal";

type Role = "admin" | "hr" | "employee" | string;
type EmploymentType = "full-time" | "part-time";

type EmployeeDoc = {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  role: Role;
  shift: string;
  salary: number;
  isActive: boolean;
  phone?: string;
  qrCode?: string;
  employmentType?: EmploymentType;
  joiningDate?: string;
  createdAt?: string;
  updatedAt?: string;
};

type Pagination = {
  currentPage: number;
  totalPages: number;
  totalEmployees: number;
  hasNext: boolean;
  hasPrev: boolean;
  limit: number;
};

type User = {
  id: string;
  email: string;
  role: Role;
};

export default function EmployeesClient({ user }: { user: User }) {
  const canWrite = user?.role === "admin" || user?.role === "hr";

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [employmentType, setEmploymentType] = useState<EmploymentType | "">("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [rows, setRows] = useState<EmployeeDoc[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeDoc | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EmployeeDoc | null>(null);

  const buildQuery = (
    params: Record<string, string | number | undefined | null>,
  ) => {
    const usp = new URLSearchParams();

    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).length > 0) {
        usp.set(k, String(v));
      }
    });

    return usp.toString();
  };

  const query = useMemo(
    () =>
      buildQuery({
        search: search || undefined,
        department: department || undefined,
        role: role || undefined,
        employmentType: employmentType || undefined,
        page,
        limit,
      }),
    [search, department, role, employmentType, page, limit],
  );

  const fetchJson = async (input: RequestInfo, init?: RequestInit) => {
    const res = await fetch(input, init);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || data?.message || "Request failed");
    }

    return data;
  };

  const normalizeEmployee = (item: any): EmployeeDoc => ({
    _id: item?._id ?? item?.id ?? "",
    employeeId: item?.employeeId ?? "",
    name: item?.name ?? "",
    email: item?.email ?? "",
    department: item?.department ?? "",
    designation: item?.designation ?? "",
    role: item?.role ?? "employee",
    shift: item?.shift ?? "",
    salary:
      typeof item?.salary === "number"
        ? item.salary
        : Number(item?.salary ?? 0),
    isActive:
      typeof item?.isActive === "boolean"
        ? item.isActive
        : String(item?.isActive).toLowerCase() === "true",
    phone: item?.phone ?? "",
    qrCode: item?.qrCode ?? "",
    employmentType:
      item?.employmentType === "part-time" ? "part-time" : "full-time",
    joiningDate: item?.joiningDate ?? "",
    createdAt: item?.createdAt ?? "",
    updatedAt: item?.updatedAt ?? "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetchJson(`/api/employees?${query}`);
      const employees = Array.isArray(res?.data?.employees)
        ? res.data.employees.map(normalizeEmployee)
        : [];

      setRows(employees);
      setPagination(res?.data?.pagination || null);
    } catch (e: any) {
      setError(e.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetFilters = () => {
    setSearch("");
    setDepartment("");
    setRole("");
    setEmploymentType("");
    setPage(1);
  };

  const openCreate = () => {
    if (!canWrite) return;
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row: EmployeeDoc) => {
    if (!canWrite) return;
    setEditing(row);
    setModalOpen(true);
  };

  const onSaved = () => {
    setModalOpen(false);
    setEditing(null);
    loadData();
  };

  const openDelete = (row: EmployeeDoc) => {
    if (!canWrite) return;
    setDeleteTarget(row);
    setDeleteOpen(true);
  };

  const closeDelete = () => {
    setDeleteOpen(false);
    setDeleteTarget(null);
  };

  const onDelete = async () => {
    if (!deleteTarget?._id) return;

    await fetchJson(`/api/employees/${deleteTarget._id}`, {
      method: "DELETE",
    });

    closeDelete();
    loadData();
  };

  return (
    <div className="min-h-screen text-zinc-100">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute top-48 -left-40 h-[420px] w-[420px] rounded-full bg-fuchsia-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[520px] w-[520px] rounded-full bg-violet-500/10 blur-[140px]" />
      </div>

      <div className="relative w-full overflow-x-hidden">
        <EmployeesToolbar
          canWrite={!!canWrite}
          totalEmployees={pagination?.totalEmployees ?? 0}
          onRefresh={loadData}
          onCreate={openCreate}
        />

        <EmployeesFilters
          search={search}
          department={department}
          role={role}
          setSearch={setSearch}
          setDepartment={setDepartment}
          setRole={setRole}
          onReset={resetFilters}
          onApply={() => {
            setPage(1);
          }}
        />

        <EmployeesTable
          rows={rows}
          loading={loading}
          error={error}
          canWrite={!!canWrite}
          pagination={pagination}
          onEdit={openEdit}
          onDelete={openDelete}
          onResetFilters={resetFilters}
          onCreate={openCreate}
          page={page}
          setPage={setPage}
          limit={limit}
          setLimit={setLimit}
          currentUserId={user?.id}
        />

        {modalOpen && (
          <EmployeeModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onSaved={onSaved}
            editing={editing}
            canWrite={!!canWrite}
          />
        )}

        <ConfirmDeleteModal
          open={deleteOpen}
          onClose={closeDelete}
          onConfirm={onDelete}
          title="Delete employee"
          description="Are you sure you want to delete this employee?"
          meta={deleteTarget?.name}
        />
      </div>
    </div>
  );
}
