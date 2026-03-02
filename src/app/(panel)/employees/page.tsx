"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDeleteModal } from "@/app/components/ConfirmDeleteModal";
import EmployeesTable from "./EmployeesTable";
import EmployeesToolbar from "./EmployeesToolbar";
import EmployeesFilters from "./EmployeesFilters";
import EmployeeModal from "./EmployeeModal";

type Role = "admin" | "hr" | "employee" | string;

type EmployeeDoc = {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  role: Role;
  shift: string;
  isActive: boolean;
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

const fetchJson = async (input: RequestInfo, init?: RequestInit) => {
  const res = await fetch(input, init);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || "Request failed");
  }

  return data;
};

const buildQuery = (
  params: Record<string, string | number | undefined | null>,
) => {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length)
      usp.set(k, String(v));
  });
  return usp.toString();
};

export default function EmployeesPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const canWrite = user?.role === "admin" || user?.role === "hr";

  /* ========= Filters ========= */
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState<Role | "">("");

  /* ========= Pagination ========= */
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  /* ========= Data ========= */
  const [rows, setRows] = useState<EmployeeDoc[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ========= Query ========= */
  const query = useMemo(
    () =>
      buildQuery({
        search: search || undefined,
        department: department || undefined,
        role: role || undefined,
        page,
        limit,
      }),
    [search, department, role, page, limit],
  );

  /* ========= Load ========= */
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetchJson(`/api/employees?${query}`);
      setRows(res?.data?.employees || []);
      setPagination(res?.data?.pagination || null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ========= Reset Filters ========= */
  const resetFilters = () => {
    setSearch("");
    setDepartment("");
    setRole("");
    setPage(1);
  };

  /* ========= Modal ========= */
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeDoc | null>(null);

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

  /* ========= Delete ========= */
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EmployeeDoc | null>(null);

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

  /* ================= RENDER ================= */

  return (
    <div className="relative w-full text-white">
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
          loadData();
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
  );
}
