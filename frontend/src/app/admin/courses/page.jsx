"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Loading3D from "@/components/Loading3D";
import { CategoriesAPI, CoursesAPI, apiMethods, handleApiError } from "@/utils/api";

const levelOptions = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const emptyCourse = {
  title: "",
  description: "",
  category: "",
  price: "0",
  duration: "0",
  level: "beginner",
  status: "draft",
  imageUrl: "",
  instructor: "",
};

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [formValues, setFormValues] = useState(emptyCourse);
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const categoriesById = useMemo(() => {
    const map = new Map();
    categories.forEach((cat) => map.set(String(cat._id ?? cat.id ?? cat.idNumber ?? cat.value), cat));
    return map;
  }, [categories]);

  const instructorsById = useMemo(() => {
    const map = new Map();
    instructors.forEach((ins) => map.set(String(ins._id ?? ins.id ?? ins.userId ?? ins.value), ins));
    return map;
  }, [instructors]);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [coursesRes, categoriesRes, instructorRes] = await Promise.all([
        CoursesAPI.list(),
        CategoriesAPI.list(),
        apiMethods.getInstructors().then((res) => res.data).catch(() => ({ data: [] })),
      ]);

      setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
      setInstructors(Array.isArray(instructorRes?.data) ? instructorRes.data : instructorRes ?? []);
    } catch (error) {
      console.error("Failed to load courses dashboard", error);
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  }

  const openCreateForm = () => {
    setFormMode("create");
    setFormValues(emptyCourse);
    setActiveCourseId(null);
    setFormOpen(true);
  };

  const openEditForm = (course) => {
    setFormMode("edit");
    setActiveCourseId(course._id ?? course.id);
    setFormValues({
      title: course.title ?? "",
      description: course.description ?? "",
      category: String(course.category?._id ?? course.category ?? ""),
      price: String(course.price ?? "0"),
      duration: String(course.duration ?? "0"),
      level: course.level ?? "beginner",
      status: course.status ?? "draft",
      imageUrl: course.imageUrl ?? "",
      instructor: String(course.instructor?._id ?? course.instructor ?? ""),
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setFormValues(emptyCourse);
    setActiveCourseId(null);
  };

  const handleFormChange = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...formValues,
      price: Number(formValues.price ?? 0),
      duration: Number(formValues.duration ?? 0),
      category: Number(formValues.category),
      instructor: Number(formValues.instructor),
    };

    if (!payload.title || !payload.description || !payload.category || !payload.instructor) {
      toast.error("Please fill in the required fields.");
      return;
    }

    try {
      setProcessing(true);
      if (formMode === "create") {
        await CoursesAPI.create(payload);
        toast.success("Course created successfully");
      } else if (activeCourseId) {
        await CoursesAPI.update(activeCourseId, payload);
        toast.success("Course updated successfully");
      }
      closeForm();
      loadAll();
    } catch (error) {
      console.error("Save course failed", error);
      toast.error(handleApiError(error));
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      setProcessing(true);
      await CoursesAPI.remove(confirmDeleteId);
      toast.success("Course deleted successfully");
      setConfirmDeleteId(null);
      loadAll();
    } catch (error) {
      console.error("Delete course failed", error);
      toast.error(handleApiError(error));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <Loading3D />;
  }

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Management</h1>
          <p className="text-gray-600 max-w-2xl">
            Create, update, and curate your course catalog. Assign categories, pricing, and instructors to keep
            offerings organized and up to date.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <span className="text-lg">➕</span>
          New Course
        </button>
      </section>

      <section className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <header className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">All Courses</h2>
            <p className="text-sm text-gray-500">{courses.length} total courses</p>
          </div>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wide">
              <tr>
                <th className="px-6 py-4 font-semibold">Course</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Instructor</th>
                <th className="px-6 py-4 font-semibold">Level</th>
                <th className="px-6 py-4 font-semibold">Price</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {courses.length === 0 ? (
                <tr>
                  <td className="px-6 py-10 text-center text-gray-500" colSpan={7}>
                    No courses available yet.
                  </td>
                </tr>
              ) : (
                courses.map((course) => {
                  const category =
                    course.category?.name ?? categoriesById.get(String(course.category))?.name ?? "—";
                  const instructor =
                    course.instructor?.name ?? instructorsById.get(String(course.instructor))?.name ?? "—";
                  return (
                    <tr key={course._id ?? course.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          {course.imageUrl ? (
                            <img
                              src={course.imageUrl}
                              alt={course.title}
                              className="w-14 h-14 rounded-xl object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-100 to-blue-100 flex items-center justify-center text-lg font-bold text-gray-600">
                              {course.title?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                          )}
                          <div>
                            <p className="text-base font-semibold text-gray-900">{course.title}</p>
                            <p className="text-sm text-gray-500 line-clamp-2 max-w-sm">{course.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{category}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{instructor}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium capitalize">
                          {course.level || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 font-semibold">
                        ₹{Number(course.price || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                            course.status === "published"
                              ? "bg-green-100 text-green-700"
                              : course.status === "draft"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {course.status ?? "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(course)}
                            className="px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(course._id ?? course.id)}
                            className="px-4 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {formOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {formMode === "create" ? "Create New Course" : "Edit Course"}
                </h3>
                <p className="text-sm text-gray-500">
                  Provide course details, assign a category, price and instructor.
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="text-gray-500 hover:text-gray-800 transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Title *</label>
                  <input
                    value={formValues.title}
                    onChange={(e) => handleFormChange("title", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="e.g. Advanced React Patterns"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Category *</label>
                  <select
                    value={formValues.category}
                    onChange={(e) => handleFormChange("category", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat._id ?? cat.id} value={cat._id ?? cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Instructor *</label>
                  <select
                    value={formValues.instructor}
                    onChange={(e) => handleFormChange("instructor", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="">Select instructor</option>
                    {instructors.map((ins) => (
                      <option key={ins._id ?? ins.id} value={ins._id ?? ins.id}>
                        {ins.name ?? ((`${ins.firstName ?? ""} ${ins.lastName ?? ""}`.trim()) || ins.email)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={formValues.price}
                      onChange={(e) => handleFormChange("price", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Duration (hours)</label>
                    <input
                      type="number"
                      min="0"
                      value={formValues.duration}
                      onChange={(e) => handleFormChange("duration", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Level</label>
                  <select
                    value={formValues.level}
                    onChange={(e) => handleFormChange("level", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 capitalize"
                  >
                    {levelOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={formValues.status}
                    onChange={(e) => handleFormChange("status", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 capitalize"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Image URL</label>
                  <input
                    value={formValues.imageUrl}
                    onChange={(e) => handleFormChange("imageUrl", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="https://example.com/course-cover.jpg"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Description *</label>
                  <textarea
                    rows={4}
                    value={formValues.description}
                    onChange={(e) => handleFormChange("description", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="Detailed overview of the course..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-blue-500 text-white font-semibold shadow-lg hover:from-orange-600 hover:to-blue-600 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {processing ? "Saving..." : formMode === "create" ? "Create Course" : "Update Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete course?</h3>
            <p className="text-sm text-gray-600 mb-6">
              This action will permanently remove the course and its modules. Students will no longer have access.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={processing}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow disabled:opacity-60"
              >
                {processing ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
