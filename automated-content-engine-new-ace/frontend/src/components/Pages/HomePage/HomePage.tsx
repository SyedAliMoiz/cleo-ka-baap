"use client";

import ModuleCard from "@/components/ModuleCard/ModuleCard";
import ModuleCardSkeleton from "@/components/ModuleCard/skeleton";
import {
  WelcomeModal,
  shouldShowWelcomeModal,
} from "@/components/WelcomeModal/WelcomeModal";
import { getModules } from "@/helpers/networking";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface Module {
  _id: string;
  name: string;
  tier: string;
  coverImage: string;
  slug: string;
  isFavorite?: boolean;
  isRecommended?: boolean;
}

export default function HomePage() {
  const [modules, setModules] = useState<Module[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        setIsLoading(true);
        const modules = await getModules();
        setModules(modules);
      } catch (error) {
        console.error("Error fetching modules:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchModules();
  }, []);

  useEffect(() => {
    // Show welcome modal on first visit after modules are loaded
    if (
      !isLoading &&
      modules &&
      modules.length > 0 &&
      shouldShowWelcomeModal()
    ) {
      setShowWelcomeModal(true);
    }
  }, [isLoading, modules]);

  const handleFavoriteChange = (moduleId: string, isFavorite: boolean) => {
    setModules((prevModules) => {
      if (!prevModules) return prevModules;
      return prevModules.map((module) =>
        module._id === moduleId ? { ...module, isFavorite } : module
      );
    });
  };

  const sortModulesWithFavoritesFirst = (modules: Module[]) => {
    return [...modules].sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return 0;
    });
  };

  const mvpModules = sortModulesWithFavoritesFirst(
    modules?.filter((module) => module.tier === "MVP") || []
  );
  const proModules = sortModulesWithFavoritesFirst(
    modules?.filter((module) => module.tier === "Pro+") || []
  );

  const mvpFavorites = mvpModules.filter((m) => m.isFavorite);
  const mvpNonFavorites = mvpModules.filter((m) => !m.isFavorite);
  const proFavorites = proModules.filter((m) => m.isFavorite);
  const proNonFavorites = proModules.filter((m) => !m.isFavorite);

  // Get recommended tool (module with isRecommended flag)
  const recommendedTool = modules?.find((m) => m.isRecommended) || null;

  return (
    <div className="min-h-screen mb-16">
      {recommendedTool && (
        <WelcomeModal
          isOpen={showWelcomeModal}
          onClose={() => setShowWelcomeModal(false)}
          recommendedToolName={recommendedTool.name}
          recommendedToolSlug={recommendedTool.slug}
        />
      )}
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-8 sm:py-10 lg:py-12 max-w-7xl">
        <section className="mb-10">
          <div className="mb-6">
            <Image src="/mvp.png" alt="MVP" width={120} height={36} />
          </div>

          {mvpFavorites.length > 0 && (
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {mvpFavorites.map((module) => (
                  <Link key={module._id} href={`/modules/${module.slug}`}>
                    <ModuleCard
                      name={module.name}
                      coverImage={module.coverImage}
                      moduleId={module._id}
                      isFavorite={module.isFavorite}
                      onFavoriteChange={(isFav) =>
                        handleFavoriteChange(module._id, isFav)
                      }
                      showRecommendedBadge={module.isRecommended}
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <ModuleCardSkeleton key={`mvp-skeleton-${index}`} />
              ))
            ) : (
              <>
                {mvpNonFavorites.map((module) => (
                  <Link key={module._id} href={`/modules/${module.slug}`}>
                    <ModuleCard
                      name={module.name}
                      coverImage={module.coverImage}
                      moduleId={module._id}
                      isFavorite={module.isFavorite}
                      onFavoriteChange={(isFav) =>
                        handleFavoriteChange(module._id, isFav)
                      }
                      showRecommendedBadge={module.isRecommended}
                    />
                  </Link>
                ))}
              </>
            )}
          </div>
        </section>

        {proModules && proModules.length > 0 && (
          <section>
            <div className="mb-6">
              <Image src="/pro+.png" alt="Pro+" width={120} height={36} />
            </div>

            {proFavorites.length > 0 && (
              <div className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {proFavorites.map((module) => (
                    <Link key={module._id} href={`/modules/${module.slug}`}>
                      <ModuleCard
                        name={module.name}
                        coverImage={module.coverImage}
                        moduleId={module._id}
                        isFavorite={module.isFavorite}
                        onFavoriteChange={(isFav) =>
                          handleFavoriteChange(module._id, isFav)
                        }
                      />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {proNonFavorites.map((module) => (
                <Link key={module._id} href={`/modules/${module.slug}`}>
                  <ModuleCard
                    name={module.name}
                    coverImage={module.coverImage}
                    moduleId={module._id}
                    isFavorite={module.isFavorite}
                    onFavoriteChange={(isFav) =>
                      handleFavoriteChange(module._id, isFav)
                    }
                  />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
