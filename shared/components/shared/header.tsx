"use client";

import { cn } from "@/shared/lib/utils";
import React from "react";
import { Container } from "./container";
import Image from "next/image";
import Link from "next/link";
import { SearchInput } from "./search-input";
import { CartButton } from "./cart-button";
import { Bell, ChefHat, Heart, MapPin } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { ProfileButton } from "./profile-button";
import { AuthModal } from "./modals";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
} from "../ui";
import { useSession } from "next-auth/react";
import { useFavoritesStore } from "@/shared/store";

const LanguageSelector = () => {
  const { i18n } = useTranslation();

  return (
    <Select
      value={i18n.language}
      onValueChange={(val) => i18n.changeLanguage(val)}
    >
      <SelectTrigger className="w-[60px] h-[38px] bg-muted border-none shadow-none focus:ring-0">
        <SelectValue placeholder="Lang" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ru">RU</SelectItem>
        <SelectItem value="tg">TG</SelectItem>
        <SelectItem value="en">EN</SelectItem>
      </SelectContent>
    </Select>
  );
};

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
      toastMessage = t("header.paidSuccess"); // Added to locales below
    }

    if (searchParams.has("verified")) {
      toastMessage = t("header.verifiedSuccess"); // Added to locales below
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
          {/* Левая часть */}
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
                <h1 className="text-lg md:text-2xl uppercase font-black leading-none tracking-tight">
                  Next Pizza
                </h1>
                <p className="text-[10px] md:text-xs text-muted-foreground leading-3 hidden md:block mt-1.5 tracking-wider uppercase font-semibold">
                  {mounted && t("header.slogan")}
                </p>
              </div>
            </div>
          </Link>

          {/* Поиск на десктопе */}
          {showSearch && (
            <div className="mx-2 md:mx-10 flex-1 hidden md:block">
              <SearchInput placeholder={t("header.searchPlaceholder")} />
            </div>
          )}

          {/* Правая часть */}
          <div className="flex items-center gap-1 md:gap-2">
            <AuthModal
              open={openAuthModal}
              onClose={() => setOpenAuthModal(false)}
            />

            <LanguageSelector />

            <Link href="/profile/favorites" aria-label="Избранное">
              <Button
                variant="secondary"
                className="px-2 md:px-4 h-[42px] rounded-2xl"
              >
                <Heart size={18} className="text-muted-foreground" />
              </Button>
            </Link>

            <Link href="/notifications">
              <Button
                variant="secondary"
                className="px-2 md:px-4 h-[42px] rounded-2xl"
              >
                <Bell size={18} className="text-muted-foreground" />
              </Button>
            </Link>

            <Link href="/pizza-builder">
              <Button
                variant="secondary"
                className="px-2 md:px-4 h-[42px] rounded-2xl"
              >
                <ChefHat size={18} className="text-muted-foreground" />
              </Button>
            </Link>

            <Link href="/delivery">
              <Button
                variant="secondary"
                className="px-2 md:px-4 h-[42px] rounded-2xl"
              >
                <MapPin size={18} className="text-muted-foreground" />
              </Button>
            </Link>

            <ProfileButton onClickSignIn={() => setOpenAuthModal(true)} />

            {showCart && (
              <CartButton className="min-w-[50px] px-2 md:px-5 h-[42px]" />
            )}
          </div>
        </div>

        {/* Поиск на мобилке (второй ряд) */}
        {showSearch && (
          <div className="mt-3 md:hidden">
            <SearchInput placeholder={t("header.searchPlaceholder")} />
          </div>
        )}
      </Container>
    </header>
  );
};
