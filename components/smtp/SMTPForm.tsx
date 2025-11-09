/**
 * SMTP Profile Form Component
 * Create/Edit SMTP profile with validation
 */

"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createSMTPProfileSchema, smtpEncryptionSchema, type CreateSMTPProfileInput } from "@/lib/validations/smtp";
import { createSMTPProfile, updateSMTPProfile } from "@/app/actions/smtp";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

const formSchema = createSMTPProfileSchema.extend({
  password: z.string().min(1, "Password is required").or(z.literal("")), // Allow empty for "keep existing"
});

type SMTPFormValues = z.infer<typeof formSchema>;

interface SMTPFormProps {
  profileId?: string;
  initialData?: Partial<SMTPFormValues>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SMTPForm({ profileId, initialData, onSuccess, onCancel }: SMTPFormProps) {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [changePassword, setChangePassword] = useState(!profileId); // Always change for new profiles

  const isEditing = !!profileId;

  const form = useForm<SMTPFormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: initialData?.name || "",
      host: initialData?.host || "",
      port: initialData?.port || 587,
      username: initialData?.username || "",
      password: "",
      encryption: (initialData?.encryption || "TLS") as "TLS" | "SSL" | "NONE",
      fromEmail: initialData?.fromEmail || "",
      fromName: initialData?.fromName,
      replyTo: initialData?.replyTo,
      maxHourlyRate: initialData?.maxHourlyRate,
      isDefault: initialData?.isDefault ?? false,
    } as SMTPFormValues,
  });

  // Update port when encryption changes
  const encryption = form.watch("encryption");
  useEffect(() => {
    if (!isEditing) {
      // Set default port based on encryption
      if (encryption === "SSL") {
        form.setValue("port", 465);
      } else if (encryption === "TLS") {
        form.setValue("port", 587);
      }
    }
  }, [encryption, form, isEditing]);

  const onSubmit = (data: SMTPFormValues) => {
    startTransition(async () => {
      try {
        // For updates, if password is empty and we're not changing it, omit password
        if (isEditing && !changePassword) {
          const { password, ...updateData } = data;
          const result = await updateSMTPProfile(profileId, updateData);
          
          if (result.success) {
            toast.success("SMTP profile updated successfully");
            onSuccess?.();
          } else {
            toast.error(result.error || "Failed to update SMTP profile");
          }
        } else {
          // For create or update with password change
          if (isEditing) {
            const result = await updateSMTPProfile(profileId, data);
            
            if (result.success) {
              toast.success("SMTP profile updated successfully");
              onSuccess?.();
            } else {
              toast.error(result.error || "Failed to update SMTP profile");
            }
          } else {
            const result = await createSMTPProfile(data as CreateSMTPProfileInput);
            
            if (result.success) {
              toast.success("SMTP profile created successfully");
              onSuccess?.();
            } else {
              toast.error(result.error || "Failed to create SMTP profile");
            }
          }
        }
      } catch (error) {
        console.error("Form submission error:", error);
        toast.error("An unexpected error occurred");
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profile Name</FormLabel>
              <FormControl>
                <Input placeholder="My SMTP Server" {...field} />
              </FormControl>
              <FormDescription>A friendly name to identify this SMTP profile</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="host"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SMTP Host</FormLabel>
                <FormControl>
                  <Input placeholder="smtp.gmail.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="port"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Port</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="587"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="encryption"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Encryption</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select encryption type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="TLS">TLS (Recommended)</SelectItem>
                  <SelectItem value="SSL">SSL</SelectItem>
                  <SelectItem value="NONE">None (Not Recommended)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                TLS uses port 587, SSL uses port 465
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="your-email@gmail.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder={isEditing && !changePassword ? "••••••••" : "Enter password"}
                      {...field}
                      disabled={isEditing && !changePassword}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                {isEditing && (
                  <FormDescription>
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 text-xs"
                      onClick={() => {
                        setChangePassword(!changePassword);
                        if (!changePassword) {
                          form.setValue("password", "");
                        }
                      }}
                    >
                      {changePassword ? "Keep existing password" : "Change password"}
                    </Button>
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="fromEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>From Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="sender@example.com" {...field} />
              </FormControl>
              <FormDescription>The email address that will appear as the sender</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fromName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>From Name (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Your Company Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="replyTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reply-To Email (Optional)</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="reply@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="maxHourlyRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Hourly Rate (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="1000"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </FormControl>
              <FormDescription>
                Maximum number of emails to send per hour (leave empty for unlimited)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isDefault"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Set as Default</FormLabel>
                <FormDescription>
                  This profile will be automatically selected for new campaigns
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : isEditing ? "Update Profile" : "Create Profile"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

