import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ReportHubCardProps = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  iconClassName?: string;
  actionLabel?: string;
};

export const ReportHubCard = ({
  title,
  description,
  href,
  icon: Icon,
  iconClassName,
  actionLabel = "View report",
}: ReportHubCardProps) => (
  <Card className="h-full">
    <CardHeader className="flex flex-row items-center justify-between space-y-0">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={cn("size-4", iconClassName ?? "text-primary")} />
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground text-sm">{description}</p>
    </CardContent>
    <CardFooter>
      <Button variant="outline" size="sm" asChild className="w-full">
        <Link href={href}>{actionLabel}</Link>
      </Button>
    </CardFooter>
  </Card>
);
