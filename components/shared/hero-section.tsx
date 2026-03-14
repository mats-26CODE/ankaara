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
        className="from-primary/15 via-primary/5 to-accent/10 absolute inset-0 -z-10 bg-linear-to-br"
        aria-hidden
      />
      <div className="container mx-auto w-full px-4 pt-16 pb-16 md:max-w-4xl">
        <div className="flex flex-col items-center space-y-4 text-center md:space-y-7">
          {/* Small label above headline */}
          <div className="dark:bg-primary/10 border-border dark:border-primary/10 rounded-full border bg-gray-100 px-4 py-2">
            <p className="text-muted-foreground dark:text-primary-foreground text-sm font-medium tracking-wide">
              {t("landing.heroLabel")}
            </p>
          </div>

          <div className="space-y-3">
            <h1 className="text-foreground text-4xl leading-[1.1] font-bold tracking-tight text-balance capitalize md:text-5xl lg:text-7xl 2xl:text-8xl">
              {t("landing.headline")}
            </h1>

            <p className="text-muted-foreground mx-auto max-w-xl text-base text-pretty md:text-lg">
              {t("landing.subheadline")}
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-10 py-4 text-base font-medium shadow-lg"
            >
              <Link href="#pricing">{t("landing.cta")}</Link>
            </Button>
            <p className="text-muted-foreground text-sm">{t("landing.noCreditCard")}</p>
          </div>

          {/* Social proof */}
          <div className="flex flex-col items-center justify-center gap-5 md:flex-row">
            <AvatarGroup className="grayscale">
              <Avatar className="size-10">
                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <Avatar className="size-10">
                <AvatarImage src="https://github.com/maxleiter.png" alt="@maxleiter" />
                <AvatarFallback>LR</AvatarFallback>
              </Avatar>
              <Avatar className="size-10">
                <AvatarImage src="https://github.com/evilrabbit.png" alt="@evilrabbit" />
                <AvatarFallback>ER</AvatarFallback>
              </Avatar>
            </AvatarGroup>

            <div className="flex flex-col items-center justify-center space-y-2 md:items-start">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                ))}
              </div>
              <p className="text-muted-foreground text-sm">{t("landing.socialProof")}</p>
            </div>
          </div>
        </div>

        {/* Trusted by + Testimonials */}
        <div className="border-border/50 mt-14 border-t pt-8 md:mt-18">
          <p className="text-muted-foreground mb-8 text-center text-xl font-medium">
            {t("landing.trustedBy")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {(["one", "two", "three"] as const).map((key) => (
              <Card
                key={key}
                className="bg-card border-border w-full rounded-xl border p-1 shadow-xs md:w-auto"
              >
                <CardContent className="flex flex-col gap-4 p-4 md:px-4 md:py-3">
                  <p className="text-foreground text-sm leading-relaxed md:text-base">
                    &ldquo;{t(`landing.testimonials.${key}.quoteStart`)}
                    <strong className="font-semibold">
                      {t(`landing.testimonials.${key}.quoteHighlight`)}
                    </strong>
                    {t(`landing.testimonials.${key}.quoteEnd`)}&rdquo;
                  </p>
                  <div className="mt-auto flex items-center gap-3">
                    <Avatar className="border-border size-10 shrink-0 border">
                      <AvatarImage src="" alt="" />
                      <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                        {t(`landing.testimonials.${key}.name`)
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-foreground truncate text-sm font-medium">
                        {t(`landing.testimonials.${key}.name`)}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
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
