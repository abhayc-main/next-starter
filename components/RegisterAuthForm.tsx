"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { cn } from "@/lib/utils"
import { userAuthSchema } from "@/lib/validations/auth"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Icons } from "@/components/icons"
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


type FormData = z.infer<typeof userAuthSchema>;

export const RegisterAuthForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm<FormData>({
    resolver: zodResolver(userAuthSchema),
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const searchParams = useSearchParams();

  const [passwordsMatch, setPasswordsMatch] = React.useState(true);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    
    // Check if password and confirmPassword match
    if (data.password !== data.confirmPassword) {
      setError("confirmPassword", {
        type: "manual",
        message: "Passwords do not match",
      });
      setPasswordsMatch(false);
      setIsLoading(false);
      return;
    }
    
    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const email = data.email.toLowerCase();
    const username = email.substring(0, email.indexOf("@"));

    // Add the user to the database
    const newUser = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        username: username, // using the part before "@" as the username
        signupDate: new Date(),
        lastLogin: null, // set to null initially
        name: null, // set to null or get from user input
        emailVerified: null, // set to null initially
      },
    })

    setPasswordsMatch(true);

    setIsLoading(false);

    if (newUser) {
      // Optionally, sign the user in after registration
      signIn("credentials", {
        username: newUser.email,
        password: data.password,
        redirect: false,
        callbackUrl: searchParams?.get("from") || "/dashboard",
      });
    } else {
      // Handle registration failure
    }
};


  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="email">
              Email
            </Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading || isGoogleLoading}
              {...register("email")}
            />
            {errors?.email && (
              <p className="px-1 text-xs text-red-600">
                {errors.email.message}
              </p>
            )}
            <Label className="sr-only" htmlFor="password">
              Password
            </Label>
            <Input
              id="password"
              placeholder="Password"
              type="password"
              disabled={isLoading || isGoogleLoading}
              {...register("password")}
            />
            {errors?.password && (
              <p className="px-1 text-xs text-red-600">
                {errors.password.message}
              </p>
            )}
            <Label className="sr-only" htmlFor="password">
              Confirm Password
            </Label>
            <Input
              id="confirm_password"
              placeholder="Re-enter your Password"
              type="password"
              disabled={isLoading || isGoogleLoading}
              className={passwordsMatch ? '' : 'border-red-500'}  // Add this line
              {...register("confirmPassword")}
            />
            {!passwordsMatch && (
              <p className="px-1 text-xs text-red-600">
                Passwords don't match
              </p>
            )}
          </div>
          <button className={cn(buttonVariants())} disabled={isLoading}>
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Your Account
          </button>
        </div>
      </form>
      <button
        type="button"
        className={cn(buttonVariants({ variant: "outline" }))}
        onClick={() => {
          setIsGoogleLoading(true);
          signIn("google");
        }}
        disabled={isLoading || isGoogleLoading}
      >
        {isGoogleLoading ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.gitHub className="mr-2 h-4 w-4" />
        )}
        Google
      </button>
    </div>
  );
};
