"use client";

import { cn } from "@/shared/lib/utils";
import React from "react";
import { Container } from "./container";
import Image from "next/image";
import Link from "next/link";
import { SearchInput } from "./search-input";
import { CartButton } from "./cart-button";
import { Bell, Heart, MapPin, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { ProfileButton } from "./profile-button";
import { AuthModal } from "./modals";
import { useTranslation } from "react-i18next";
import { Button } from "../ui";
import { useSession } from "next-auth/react";
import { useFavoritesStore } from "@/shared/store";
import { ThemeToggle } from "./theme-toggle";

interface Props {
  hasSearch?: boolean;
  hasCart?: boolean;
  className?: string;
}

export const Header: React.FC<Props> = ({
  hasSearch = true,
  hasCart = true,
  className,
}) => {
  const router = useRouter();
  const [openAuthModal, setOpenAuthModal] = React.useState(false);
  const { t } = useTranslation();
  const { data: session } = useSession();
  const isCourier = session?.user?.role === "COURIER";
  const fetchFavoriteIds = useFavoritesStore((s) => s.fetchIds);

  React.useEffect(() => {
    if (session) fetchFavoriteIds();
  }, [session, fetchFavoriteIds]);
  const showSearch = hasSearch && !isCourier;
  const showCart = hasCart && !isCourier;

  const searchParams = useSearchParams();

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    let toastMessage = "";

    if (searchParams.has("paid")) {
      toastMessage = t("header.paidSuccess");
    }

    if (searchParams.has("verified")) {
      toastMessage = t("header.verifiedSuccess");
    }

    if (toastMessage) {
      setTimeout(() => {
        router.replace("/");
        toast.success(toastMessage, {
          duration: 3000,
        });
      }, 1000);
    }
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 glass border-b border-border/40",
        className,
      )}
    >
      <Container className="py-3 md:py-5">
        <div className="flex items-center justify-between gap-2">
          {}
          <Link href="/" className="group">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={38}
                  height={38}
                  className="relative"
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-display text-xl md:text-[26px] leading-none">
                  Next Pizza
                </h1>
                <p className="text-[10px] md:text-xs text-muted-foreground leading-3 hidden md:block mt-1.5 tracking-wider uppercase font-semibold">
                  {mounted && t("header.slogan")}
                </p>
              </div>
            </div>
          </Link>

          {}
          {showSearch && (
            <div className="mx-2 md:mx-10 flex-1 hidden md:block">
              <SearchInput placeholder={t("header.searchPlaceholder")} />
            </div>
          )}

          {}
          <div className="flex items-center gap-1 md:gap-2">
            <AuthModal
              open={openAuthModal}
              onClose={() => setOpenAuthModal(false)}
            />

            <ThemeToggle />

            {}
            <div className="flex items-center gap-0.5">
              <Link href="/profile/favorites" aria-label={t("header.favorites")}>
                <Button
                  variant="ghost"
                  title={t("header.favorites")}
                  className="px-2.5 h-[42px] rounded-2xl"
                >
                  <Heart size={18} className="text-muted-foreground" />
                </Button>
              </Link>

              <Link href="/notifications" aria-label={t("tabs.notifications")}>
                <Button
                  variant="ghost"
                  title={t("tabs.notifications")}
                  className="px-2.5 h-[42px] rounded-2xl hidden sm:inline-flex"
                >
                  <Bell size={18} className="text-muted-foreground" />
                </Button>
              </Link>

              <Link href="/delivery" aria-label={t("checkout.delivery")}>
                <Button
                  variant="ghost"
                  title={t("checkout.delivery")}
                  className="px-2.5 h-[42px] rounded-2xl hidden sm:inline-flex"
                >
                  <MapPin size={18} className="text-muted-foreground" />
                </Button>
              </Link>

              <Link href="/group-order" aria-label={t("header.groupOrder")}>
                <Button
                  variant="ghost"
                  title={t("header.groupOrder")}
                  className="px-2.5 h-[42px] rounded-2xl hidden lg:inline-flex"
                >
                  <Users size={18} className="text-muted-foreground" />
                </Button>
              </Link>
            </div>

            <ProfileButton onClickSignIn={() => setOpenAuthModal(true)} />

            {showCart && (
              <CartButton className="min-w-[50px] px-2 md:px-5 h-[42px]" />
            )}
          </div>
        </div>

        {}
        {showSearch && (
          <div className="mt-3 md:hidden">
            <SearchInput placeholder={t("header.searchPlaceholder")} />
          </div>
        )}
      </Container>
    </header>
  );
};
