"use client"

import * as React from "react"
import type { Label as LabelPrimitive } from "radix-ui"
import { Slot } from "radix-ui"
import { useField } from "@tanstack/react-form"
import type { FieldApi } from "@tanstack/react-form"

import { cn } from "#/lib/utils.ts"
import { Label } from "#/components/ui/label.tsx"

type FormFieldContextValue = {
  name: string
  formItemId: string
  formDescriptionId: string
  formMessageId: string
  isInvalid: boolean
  errors: string[]
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null)

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    isInvalid: fieldContext.isInvalid,
    errors: fieldContext.errors,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div
        data-slot="form-item"
        className={cn("grid gap-2", className)}
        {...props}
      />
    </FormItemContext.Provider>
  )
}

function FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  const { isInvalid, formItemId } = useFormField()

  return (
    <Label
      data-slot="form-label"
      data-error={isInvalid}
      className={cn("data-[error=true]:text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
}

function FormControl({ ...props }: React.ComponentProps<typeof Slot.Root>) {
  const { isInvalid, formItemId, formDescriptionId, formMessageId } =
    useFormField()

  return (
    <Slot.Root
      data-slot="form-control"
      id={formItemId}
      aria-describedby={
        !isInvalid
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={isInvalid}
      {...props}
    />
  )
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { formDescriptionId } = useFormField()

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function FormMessage({ className, ...props }: React.ComponentProps<"p">) {
  const { errors, formMessageId } = useFormField()
  const body = errors.length > 0 ? errors[0] : props.children

  if (!body) {
    return null
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn("text-sm text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
}

function FormField({
  name,
  children,
}: {
  name: string
  children: React.ReactNode
}) {
  const id = React.useId()
  const formItemId = `${id}-form-item`
  const formDescriptionId = `${id}-form-item-description`
  const formMessageId = `${id}-form-item-message`

  const fieldContext = React.useMemo(
    () => ({
      name,
      formItemId,
      formDescriptionId,
      formMessageId,
      isInvalid: false,
      errors: [],
    }),
    [name, formItemId, formDescriptionId, formMessageId]
  )

  return (
    <FormFieldContext.Provider value={fieldContext}>
      {children}
    </FormFieldContext.Provider>
  )
}

function Form({
  onSubmit,
  children,
}: {
  onSubmit: (e: React.FormEvent) => void
  children: React.ReactNode
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {children}
    </form>
  )
}

export { useFormField, Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField }
