"use client";

import { Controller, useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";
import { RiAddLine, RiDeleteBinLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  formatMoney,
  fromHundredths,
  lineTotalHundredths,
} from "@/lib/invoices/calculations";
import {
  MAX_LINE_ITEMS,
  type InvoiceFormValues,
  type LineItemFormValues,
} from "@/lib/invoices/schemas";

const UNIT_ITEMS = [
  { value: "hours", label: "Hours" },
  { value: "flat", label: "Flat" },
];

export const EMPTY_LINE: LineItemFormValues = {
  description: "",
  quantity: "1",
  unit_type: "flat",
  unit_price: "0.00",
};

export function LineItemsTable({
  form,
  disabled,
}: {
  form: UseFormReturn<InvoiceFormValues>;
  disabled: boolean;
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "line_items",
  });
  const lines = useWatch({ control: form.control, name: "line_items" });
  const currency = useWatch({ control: form.control, name: "currency" });
  const errors = form.formState.errors.line_items;

  return (
    <div className="flex flex-col gap-3">
      <div className="hidden grid-cols-[1fr_6rem_7rem_8rem_7rem_2rem] gap-3 px-1 text-xs font-medium text-muted-foreground md:grid">
        <span>Description</span>
        <span>Quantity</span>
        <span>Unit</span>
        <span>Price per unit</span>
        <span className="text-right">Amount</span>
        <span className="sr-only">Remove</span>
      </div>

      {fields.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          No rows yet. Add what you are billing for.
        </p>
      ) : null}

      <ul className="flex flex-col gap-3">
        {fields.map((field, index) => {
          const rowErrors = errors?.[index];
          const line = lines?.[index];
          const amount = line
            ? fromHundredths(lineTotalHundredths(line.quantity ?? "0", line.unit_price ?? "0"))
            : "0.00";

          return (
            <li
              key={field.id}
              className="grid grid-cols-2 gap-3 rounded-xl border p-3 md:grid-cols-[1fr_6rem_7rem_8rem_7rem_2rem] md:items-start md:rounded-none md:border-0 md:p-1"
            >
              <Field className="col-span-2 md:col-span-1" data-invalid={Boolean(rowErrors?.description)}>
                <FieldLabel htmlFor={`line-${index}-description`} className="md:sr-only">
                  Description
                </FieldLabel>
                <Textarea
                  id={`line-${index}-description`}
                  rows={1}
                  className="min-h-8"
                  placeholder="What you did or delivered"
                  disabled={disabled}
                  aria-invalid={Boolean(rowErrors?.description)}
                  {...form.register(`line_items.${index}.description`)}
                />
                <FieldError errors={[rowErrors?.description]} />
              </Field>

              <Field data-invalid={Boolean(rowErrors?.quantity)}>
                <FieldLabel htmlFor={`line-${index}-quantity`} className="md:sr-only">
                  Quantity
                </FieldLabel>
                <Input
                  id={`line-${index}-quantity`}
                  inputMode="decimal"
                  disabled={disabled}
                  aria-invalid={Boolean(rowErrors?.quantity)}
                  {...form.register(`line_items.${index}.quantity`)}
                />
                <FieldError errors={[rowErrors?.quantity]} />
              </Field>

              <Field data-invalid={Boolean(rowErrors?.unit_type)}>
                <FieldLabel htmlFor={`line-${index}-unit`} className="md:sr-only">
                  Unit
                </FieldLabel>
                <Controller
                  control={form.control}
                  name={`line_items.${index}.unit_type`}
                  render={({ field: unitField }) => (
                    <Select
                      items={UNIT_ITEMS}
                      value={unitField.value}
                      onValueChange={(value) => unitField.onChange(value ?? "flat")}
                      disabled={disabled}
                    >
                      <SelectTrigger id={`line-${index}-unit`} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIT_ITEMS.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>

              <Field data-invalid={Boolean(rowErrors?.unit_price)}>
                <FieldLabel htmlFor={`line-${index}-price`} className="md:sr-only">
                  Price per unit
                </FieldLabel>
                <Input
                  id={`line-${index}-price`}
                  inputMode="decimal"
                  disabled={disabled}
                  aria-invalid={Boolean(rowErrors?.unit_price)}
                  {...form.register(`line_items.${index}.unit_price`)}
                />
                <FieldError errors={[rowErrors?.unit_price]} />
              </Field>

              <div className="flex flex-col gap-1 md:h-8 md:justify-center">
                <span className="text-xs font-medium text-muted-foreground md:sr-only">Amount</span>
                <span className="text-sm tabular-nums md:text-right">
                  {formatMoney(amount, currency)}
                </span>
              </div>

              <div className="flex items-end justify-end md:items-start">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove row ${index + 1}`}
                  disabled={disabled}
                  onClick={() => remove(index)}
                >
                  <RiDeleteBinLine />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      {errors?.root?.message || errors?.message ? (
        <p role="alert" className="text-sm text-destructive">
          {errors.root?.message ?? errors.message}
        </p>
      ) : null}

      <div>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || fields.length >= MAX_LINE_ITEMS}
          onClick={() => append({ ...EMPTY_LINE })}
        >
          <RiAddLine data-icon="inline-start" />
          Add row
        </Button>
      </div>
    </div>
  );
}
