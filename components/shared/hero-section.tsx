"use client";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import Link from "next/link";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, AvatarGroup } from "../ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

const HeroSection = () => {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden">
      {/* Gradient overlay - theme-aware (works in light/dark) */}
      <div
        className="absolute inset-0 -z-10 bg-linear-to-br from-primary/15 via-primary/5 to-accent/10"
        aria-hidden
      />
      <div className="container w-full md:max-w-4xl mx-auto px-4 pt-16 pb-16">
        <div className="flex flex-col items-center text-center space-y-4 md:space-y-7">
          {/* Small label above headline */}
          <div className="bg-gray-100 dark:bg-primary/10 rounded-full px-4 py-2 border border-border dark:border-primary/10">
            <p className="text-sm font-medium text-muted-foreground tracking-wide dark:text-primary-foreground">
              {t("landing.heroLabel")}
            </p>
          </div>

          <div className="space-y-3">
            <h1 className="capitalize text-4xl md:text-5xl lg:text-7xl 2xl:text-8xl font-bold text-foreground tracking-tight text-balance leading-[1.1]">
              {t("landing.headline")}
            </h1>

            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto text-pretty">
              {t("landing.subheadline")}
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <Button
              asChild
              size="lg"
              className="rounded-full px-10 py-4 text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
            >
              <Link href="#pricing">{t("landing.cta")}</Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              {t("landing.noCreditCard")}
            </p>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-5 justify-center">
            <AvatarGroup className="grayscale">
              <Avatar className="size-10">
                <AvatarImage
                  src="https://github.com/shadcn.png"
                  alt="@shadcn"
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <Avatar className="size-10">
                <AvatarImage
                  src="https://github.com/maxleiter.png"
                  alt="@maxleiter"
                />
                <AvatarFallback>LR</AvatarFallback>
              </Avatar>
              <Avatar className="size-10">
                <AvatarImage
                  src="https://github.com/evilrabbit.png"
                  alt="@evilrabbit"
                />
                <AvatarFallback>ER</AvatarFallback>
              </Avatar>
            </AvatarGroup>

            <div className="space-y-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                    aria-hidden
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {t("landing.socialProof")}
              </p>
            </div>
          </div>
        </div>

        {/* Trusted by + Testimonials */}
        <div className="mt-14 md:mt-18 pt-8 border-t border-border/50">
          <p className="text-center text-sm text-muted-foreground mb-8">
            {t("landing.trustedBy")}
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {(["one", "two", "three"] as const).map((key) => (
              <Card
                key={key}
                className="p-1 bg-card border border-border rounded-xl shadow-xs"
              >
                <CardContent className="p-4 md:py-3 md:px-4 flex flex-col gap-4">
                  <p className="text-sm md:text-base text-foreground leading-relaxed">
                    &ldquo;{t(`landing.testimonials.${key}.quoteStart`)}
                    <strong className="font-semibold">
                      {t(`landing.testimonials.${key}.quoteHighlight`)}
                    </strong>
                    {t(`landing.testimonials.${key}.quoteEnd`)}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 mt-auto">
                    <Avatar className="size-10 shrink-0 border border-border">
                      <AvatarImage src="" alt="" />
                      <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                        {t(`landing.testimonials.${key}.name`)
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {t(`landing.testimonials.${key}.name`)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {t(`landing.testimonials.${key}.affiliation`)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export { HeroSection };
