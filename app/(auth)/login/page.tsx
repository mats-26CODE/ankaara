"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Phone } from "lucide-react";
import { useGoogleOAuth, useSendOtp } from "@/hooks/use-auth";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { APP_NAME } from "@/constants/values";
import { useTranslation } from "@/hooks/use-translation";
import { validatePhoneNumber } from "@/helpers/helpers";
import Link from "next/link";

const LoginContent = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const [formData, setFormData] = useState({
    phone: "",
  });
  const [error, setError] = useState<string | null>(null);
  const googleOAuthMutation = useGoogleOAuth();
  const sendOtpMutation = useSendOtp(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Only allow numeric input
    const numericValue = value.replace(/\D/g, "");
    setFormData((prev) => ({ ...prev, [name]: numericValue }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate phone number
    const validation = validatePhoneNumber(formData.phone);
    if (!validation.isValid) {
      setError(validation.error || t("auth.login.error"));
      return;
    }

    // Send OTP and navigate to verify-otp page (preserve redirect for after login)
    sendOtpMutation.mutate(
      { phone: formData.phone },
      {
        onSuccess: () => {
          const verifyUrl = new URL("/verify-otp", window.location.origin);
          verifyUrl.searchParams.set("phone", formData.phone);
          if (redirect) verifyUrl.searchParams.set("redirect", redirect);
          router.push(verifyUrl.pathname + verifyUrl.search);
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : t("auth.login.error"));
        },
      },
    );
  };

  const handleGoogleSignIn = () => {
    googleOAuthMutation.mutate();
  };

  const testimonial = {
    quote: `${APP_NAME} has made getting paid on time a breeze. Professional invoices, payment links, and mobile money—everything I need in one place.`,
    author: `@${APP_NAME.toLowerCase()}_user`,
  };

  return (
    <div className="flex min-h-screen">
      <div className="bg-background flex flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8">
            <div className="mb-8">
              <Logo />
            </div>

            <div className="space-y-2">
              <h1 className="text-foreground text-3xl font-bold">{t("auth.login.welcome")}</h1>
              <p className="text-muted-foreground">{t("auth.login.subtitle")}</p>
            </div>

            {/* Google OAuth Button - Primary */}
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full border-2"
              onClick={handleGoogleSignIn}
              disabled={sendOtpMutation.isPending}
              isLoading={googleOAuthMutation.isPending}
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {t("auth.login.googleSignIn")}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background text-muted-foreground px-2">
                  {t("auth.login.orContinueWith")}
                </span>
              </div>
            </div>

            {(error || sendOtpMutation.isError) && (
              <div className="text-destructive bg-destructive/10 border-destructive/20 rounded-md border p-3 text-sm">
                {error ||
                  (sendOtpMutation.error instanceof Error
                    ? sendOtpMutation.error.message
                    : t("auth.login.error"))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="phone">{t("auth.login.phone")}</Label>
                <InputGroup className="bg-muted/50 border-primary/20 text-foreground placeholder:text-muted-foreground h-10 flex-1 border">
                  <InputGroupAddon align="inline-start">
                    <Phone className="size-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number (e.g. 07XXXXXXXX)"
                    required
                    disabled={sendOtpMutation.isPending}
                    maxLength={10}
                  />
                </InputGroup>
                <p className="text-muted-foreground text-xs">
                  Phone number must start with 0 and contain only numbers
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={sendOtpMutation.isPending}
              >
                {t("auth.login.signIn")}
              </Button>
            </form>

            <p className="text-muted-foreground text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/sign-up" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </p>

            <p className="text-muted-foreground text-center text-xs">
              By continuing, you agree to {APP_NAME}&apos;s{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              , and to receive periodic emails with updates if subscribed.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-muted/30 relative hidden flex-1 items-center justify-center overflow-hidden p-12 lg:flex">
        <div className="relative z-10 w-full max-w-lg space-y-8">
          <div className="text-muted-foreground/40">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
              <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
            </svg>
          </div>

          <blockquote className="text-foreground text-2xl leading-relaxed font-medium lg:text-3xl">
            {testimonial.quote}
          </blockquote>

          <div className="flex items-center gap-3">
            <div className="text-foreground font-medium">{testimonial.author}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoginPage = () => (
  <Suspense fallback={null}>
    <LoginContent />
  </Suspense>
);

export default LoginPage;
