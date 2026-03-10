import React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { APP_NAME } from "@/constants/values";

const Logo = () => {
  return (
    <Link href={"/"} className="flex items-center gap-1">
      <Avatar className="size-6 bg-primary border-0 mt-2.5">
        <AvatarImage src="/person-working.png" alt="logo" />
        <AvatarFallback className="font-brand font-bold text-2xl text-white -mt-[4px] bg-transparent">{APP_NAME.charAt(0)}</AvatarFallback>
      </Avatar>
      <span className="text-3xl font-brand text-foreground">{APP_NAME}</span>
    </Link>
  );
};

export default Logo;
