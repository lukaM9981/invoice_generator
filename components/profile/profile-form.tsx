"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/lib/profile/actions";
import {
  profileSchema,
  type ProfileFormValues,
  type ProfileSender,
} from "@/lib/profile/schemas";

function toFormValues(profile: ProfileSender): ProfileFormValues {
  return {
    full_name: profile.full_name ?? "",
    company_name: profile.company_name ?? "",
    email: profile.email ?? "",
    address: profile.address ?? "",
    vat_id: profile.vat_id ?? "",
    website: profile.website ?? "",
  };
}

export function ProfileForm({ profile }: { profile: ProfileSender }) {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema, undefined, { raw: true }),
    defaultValues: toFormValues(profile),
  });

  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: ProfileFormValues) {
    const result = await updateProfile(values);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    const saved = profileSchema.parse(values);
    form.reset({
      full_name: saved.full_name ?? "",
      company_name: saved.company_name ?? "",
      email: saved.email ?? "",
      address: saved.address ?? "",
      vat_id: saved.vat_id ?? "",
      website: saved.website ?? "",
    });
    toast.success("Profile saved.");
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Sender details</CardTitle>
        <CardDescription>
          Printed in the From block of every invoice.
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <CardContent className="pb-5">
          <FieldGroup>
            <Field data-invalid={Boolean(errors.full_name)}>
              <FieldLabel htmlFor="full_name">Full name</FieldLabel>
              <Input
                id="full_name"
                autoComplete="name"
                aria-invalid={Boolean(errors.full_name)}
                {...form.register("full_name")}
              />
              <FieldError errors={[errors.full_name]} />
            </Field>

            <Field data-invalid={Boolean(errors.company_name)}>
              <FieldLabel htmlFor="company_name">Company name</FieldLabel>
              <Input
                id="company_name"
                autoComplete="organization"
                aria-invalid={Boolean(errors.company_name)}
                {...form.register("company_name")}
              />
              <FieldError errors={[errors.company_name]} />
            </Field>

            <Field data-invalid={Boolean(errors.email)}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={Boolean(errors.email)}
                {...form.register("email")}
              />
              <FieldDescription>
                Shown on invoices. This does not change your login email.
              </FieldDescription>
              <FieldError errors={[errors.email]} />
            </Field>

            <Field data-invalid={Boolean(errors.address)}>
              <FieldLabel htmlFor="address">Address</FieldLabel>
              <Textarea
                id="address"
                autoComplete="street-address"
                aria-invalid={Boolean(errors.address)}
                {...form.register("address")}
              />
              <FieldError errors={[errors.address]} />
            </Field>

            <Field data-invalid={Boolean(errors.vat_id)}>
              <FieldLabel htmlFor="vat_id">VAT ID</FieldLabel>
              <Input
                id="vat_id"
                autoComplete="off"
                aria-invalid={Boolean(errors.vat_id)}
                {...form.register("vat_id")}
              />
              <FieldError errors={[errors.vat_id]} />
            </Field>

            <Field data-invalid={Boolean(errors.website)}>
              <FieldLabel htmlFor="website">Website</FieldLabel>
              <Input
                id="website"
                type="url"
                autoComplete="url"
                placeholder="https://example.com"
                aria-invalid={Boolean(errors.website)}
                {...form.register("website")}
              />
              <FieldError errors={[errors.website]} />
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
