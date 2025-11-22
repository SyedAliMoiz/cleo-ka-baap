"use client";

import React from "react";
import { DashboardLayout } from "../../../src/components/DashboardLayout/DashboardLayout";
import Link from "next/link";

export default function AddClientPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              Add New Client
            </h1>
            <p className="text-gray-600">
              Create a new client profile to manage content creation
            </p>
          </div>

          <Link
            href="/clients"
            className="text-gray-700 hover:text-primary px-4 py-2 rounded-lg inline-flex items-center border border-gray-300 bg-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <path d="M19 12H5"></path>
              <path d="M12 19l-7-7 7-7"></path>
            </svg>
            Back to Clients
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form>
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h2 className="text-lg font-medium text-gray-800 mb-4">
                  Basic Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Client Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter client's name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="business"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Business/Brand
                    </label>
                    <input
                      type="text"
                      id="business"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter business or brand name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter email address"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="website"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Website
                    </label>
                    <input
                      type="text"
                      id="website"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter website URL"
                    />
                  </div>
                </div>
              </div>

              {/* Business Details */}
              <div className="pt-6 border-t border-gray-200">
                <h2 className="text-lg font-medium text-gray-800 mb-4">
                  Business Details
                </h2>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Business Description
                    </label>
                    <textarea
                      id="description"
                      rows={4}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Brief description of the client's business and offerings"
                    ></textarea>
                  </div>

                  <div>
                    <label
                      htmlFor="target-audience"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Target Audience
                    </label>
                    <textarea
                      id="target-audience"
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Describe the primary audience for the client's business"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Content Goals */}
              <div className="pt-6 border-t border-gray-200">
                <h2 className="text-lg font-medium text-gray-800 mb-4">
                  Content Goals
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Primary Goals (Select up to 3)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        "Increase brand awareness",
                        "Generate leads",
                        "Position as thought leader",
                        "Drive engagement",
                        "Build community",
                        "Launch new product/service",
                        "Drive newsletter signups",
                        "Educational content",
                      ].map((goal) => (
                        <div key={goal} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`goal-${goal
                              .replace(/\s+/g, "-")
                              .toLowerCase()}`}
                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                          />
                          <label
                            htmlFor={`goal-${goal
                              .replace(/\s+/g, "-")
                              .toLowerCase()}`}
                            className="ml-2 text-sm text-gray-700"
                          >
                            {goal}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="custom-goals"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Custom Goals or Objectives
                    </label>
                    <textarea
                      id="custom-goals"
                      rows={2}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Any additional goals or objectives for content creation"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Niche & Tags */}
              <div className="pt-6 border-t border-gray-200">
                <h2 className="text-lg font-medium text-gray-800 mb-4">
                  Niche & Tags
                </h2>

                <div>
                  <label
                    htmlFor="tags"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Niche Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    id="tags"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="E.g. Tech, SaaS, Marketing, AI, Leadership"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Add relevant tags that describe the client's industry,
                    interests, and content topics
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                >
                  Create Client
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
