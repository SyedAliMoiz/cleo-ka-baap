"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "../../src/components/DashboardLayout/DashboardLayout";
import { useDarkMode } from "../../src/components/DarkModeProvider";
import { apiClient } from "../../src/utils/apiClient";

interface Client {
  _id: string;
  name: string;
  bio: string;
  nicheTags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function ClientsPage() {
  const router = useRouter();
  const { isDarkMode } = useDarkMode();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const clientsData = await apiClient<Client[]>("/clients");
        setClients(clientsData);
      } catch (err) {
        console.error("Failed to fetch clients:", err);
        setError("Failed to load clients");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this client?")) {
      setIsDeleting(id);
      try {
        await apiClient(`/clients/${id}`, { method: "DELETE" });
        setClients(clients.filter((client) => client._id !== id));
      } catch (err) {
        console.error("Failed to delete client:", err);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1
            className={`text-2xl font-semibold ${
              isDarkMode ? "text-white" : "text-gray-800"
            }`}
          >
            Clients
          </h1>
          <Link
            href="/clients/new"
            className={`px-4 py-2 rounded-md flex items-center transition-all duration-200 ${
              isDarkMode
                ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white shadow-lg hover:shadow-xl"
                : "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white shadow-lg hover:shadow-xl"
            } hover:transform hover:-translate-y-0.5`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Client
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse">
              <div className="h-12 w-12 rounded-full bg-primary/30"></div>
            </div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-red-500">{error}</div>
          </div>
        ) : clients.length === 0 ? (
          <div
            className={`
            rounded-lg border p-10 text-center
            ${
              isDarkMode
                ? "bg-gray-800 border-gray-700 text-gray-300"
                : "bg-white border-gray-200 text-gray-600"
            }
          `}
          >
            <h3 className="text-lg font-medium mb-2">No clients yet</h3>
            <p className="mb-4">Add your first client to get started</p>
            <Link
              href="/clients/new"
              className={`px-4 py-2 rounded-md inline-flex items-center transition-all duration-200 ${
                isDarkMode
                  ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white shadow-lg hover:shadow-xl"
                  : "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white shadow-lg hover:shadow-xl"
              } hover:transform hover:-translate-y-0.5`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add First Client
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {clients.map((client) => (
              <div
                key={client._id}
                className={`
                  rounded-lg border p-4 relative
                  ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-700 hover:border-purple-500"
                      : "bg-white border-gray-200 hover:border-purple-300"
                  } hover:shadow-md transition-all duration-200
                `}
              >
                <div className="flex justify-between mb-2">
                  <h2
                    className={`text-xl font-semibold ${
                      isDarkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {client.name}
                  </h2>
                  <div className="flex gap-3">
                    <Link
                      href={`/clients/${client._id}/edit`}
                      className={`
                        px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-1.5
                        ${
                          isDarkMode
                            ? "bg-gray-700/50 hover:bg-blue-600/20 text-gray-300 hover:text-blue-300 border border-gray-600 hover:border-blue-500/30"
                            : "bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 border border-gray-200 hover:border-blue-300"
                        } hover:shadow-sm
                      `}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(client._id)}
                      disabled={isDeleting === client._id}
                      className={`
                        px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-1.5
                        ${
                          isDarkMode
                            ? "bg-gray-700/50 hover:bg-red-600/20 text-gray-300 hover:text-red-300 border border-gray-600 hover:border-red-500/30"
                            : "bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-200 hover:border-red-300"
                        } hover:shadow-sm
                        ${
                          isDeleting === client._id
                            ? "opacity-60 cursor-not-allowed"
                            : ""
                        }
                      `}
                    >
                      {isDeleting === client._id ? (
                        <>
                          <svg
                            className="animate-spin h-3.5 w-3.5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3,6 5,6 21,6"></polyline>
                            <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <p
                  className={`mb-3 text-sm ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {client.bio}
                </p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {client.nicheTags.map((tag, index) => (
                    <span
                      key={index}
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        isDarkMode
                          ? "bg-purple-900/50 text-purple-200 border border-purple-700"
                          : "bg-purple-100 text-purple-800 border border-purple-300"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div
                  className={`text-xs mt-2 ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Last updated:{" "}
                  {new Date(client.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
