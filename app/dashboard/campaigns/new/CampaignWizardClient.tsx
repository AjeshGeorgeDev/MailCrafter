/**
 * Campaign Wizard Client Component
 * Multi-step campaign creation wizard
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Mail,
  FileText,
  Users,
  Calendar as CalendarIcon,
  Eye,
  Send,
} from "lucide-react";
import { createCampaign, addCampaignRecipients, addCampaignRecipientsFromSegment } from "@/app/actions/campaigns";
import { toast } from "sonner";
import { CSVImport } from "@/components/campaigns/CSVImport";
import { SegmentSelector } from "@/components/campaigns/SegmentSelector";
import type { CSVRecipient } from "@/lib/campaigns/csv-importer";

const campaignSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional(),
  templateId: z.string().min(1, "Template is required"),
  subject: z.string().min(1, "Subject is required").max(255),
  smtpProfileId: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

interface Template {
  id: string;
  name: string;
  description: string | null;
}

interface SMTPProfile {
  id: string;
  name: string;
  isDefault: boolean;
}

interface CampaignWizardClientProps {
  initialTemplates: Template[];
  initialSMTPProfiles: SMTPProfile[];
  defaultLanguage: string;
}

const STEPS = [
  { id: 1, name: "Basic Info", icon: FileText },
  { id: 2, name: "Template", icon: Mail },
  { id: 3, name: "Email Config", icon: Mail },
  { id: 4, name: "Recipients", icon: Users },
  { id: 5, name: "Schedule", icon: CalendarIcon },
  { id: 6, name: "Review", icon: Eye },
];

export function CampaignWizardClient({
  initialTemplates,
  initialSMTPProfiles,
  defaultLanguage,
}: CampaignWizardClientProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [recipients, setRecipients] = useState<Array<{ email: string; name?: string; variables?: Record<string, any> }>>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [selectedSegmentCount, setSelectedSegmentCount] = useState<number>(0);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [scheduledTime, setScheduledTime] = useState("");

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      description: "",
      templateId: "",
      subject: "",
      smtpProfileId: initialSMTPProfiles.find((p) => p.isDefault)?.id || "",
      scheduledAt: undefined,
    },
  });

  const selectedTemplate = initialTemplates.find(
    (t) => t.id === form.watch("templateId")
  );

  const nextStep = () => {
    // Validate current step before proceeding
    if (currentStep === 1) {
      form.trigger(["name"]);
      if (!form.formState.errors.name) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      form.trigger(["templateId"]);
      if (!form.formState.errors.templateId) {
        setCurrentStep(3);
      }
    } else if (currentStep === 3) {
      form.trigger(["subject"]);
      if (!form.formState.errors.subject) {
        setCurrentStep(4);
      }
    } else if (currentStep === 4) {
      if (recipients.length === 0) {
        toast.error("Please add at least one recipient");
        return;
      }
      setCurrentStep(5);
    } else if (currentStep === 5) {
      setCurrentStep(6);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = (data: CampaignFormValues) => {
    startTransition(async () => {
      // Build scheduledAt if date and time are set
      let scheduledAt: string | undefined = undefined;
      if (scheduledDate && scheduledTime) {
        const [hours, minutes] = scheduledTime.split(":");
        const scheduled = new Date(scheduledDate);
        scheduled.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        scheduledAt = scheduled.toISOString();
      }

      const result = await createCampaign({
        ...data,
        scheduledAt,
      });

      if (result.success && result.campaign) {
        // Add recipients from segment if selected
        if (selectedSegmentId) {
          const segmentResult = await addCampaignRecipientsFromSegment(
            result.campaign.id,
            selectedSegmentId
          );
          if (segmentResult.error) {
            toast.warning("Campaign created but failed to add recipients from segment");
          } else if (segmentResult.success) {
            toast.success(`Added ${segmentResult.added || 0} recipients from segment`);
          }
        }
        
        // Add recipients from CSV if any
        if (recipients.length > 0) {
          const recipientsResult = await addCampaignRecipients(
            result.campaign.id,
            recipients
          );
          if (recipientsResult.error) {
            toast.warning("Campaign created but failed to add CSV recipients");
          }
        }

        toast.success("Campaign created successfully");
        router.push(`/dashboard/campaigns/${result.campaign.id}`);
      } else {
        toast.error(result.error || "Failed to create campaign");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Campaign</h1>
        <p className="text-muted-foreground">
          Follow the steps below to create your email campaign
        </p>
      </div>

      {/* Step Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground border-primary"
                          : isCompleted
                          ? "bg-green-500 text-white border-green-500"
                          : "bg-muted text-muted-foreground border-muted"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-xs mt-2",
                        isActive ? "font-medium" : "text-muted-foreground"
                      )}
                    >
                      {step.name}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "h-0.5 flex-1 mx-2",
                        isCompleted ? "bg-green-500" : "bg-muted"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Give your campaign a name and description
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Q4 Newsletter" {...field} />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for this campaign
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Campaign description..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 2: Select Template */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Select Template</CardTitle>
                <CardDescription>
                  Choose the email template for this campaign
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="templateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a template" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {initialTemplates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {selectedTemplate && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="font-medium">{selectedTemplate.name}</p>
                    {selectedTemplate.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedTemplate.description}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Email Configuration */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Email Configuration</CardTitle>
                <CardDescription>
                  Configure the email subject and sending settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Subject</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Welcome to our newsletter!"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        You can use variables like {"{{user.name}}"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="smtpProfileId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Profile</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select SMTP profile" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {initialSMTPProfiles.map((profile) => (
                            <SelectItem key={profile.id} value={profile.id}>
                              <div className="flex items-center gap-2">
                                {profile.name}
                                {profile.isDefault && (
                                  <Badge variant="outline" className="text-xs">
                                    Default
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        SMTP profile to use for sending this campaign
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 4: Recipients */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Recipients</CardTitle>
                <CardDescription>
                  Add recipients for this campaign via segment or CSV import
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-3">Select Segment</h3>
                  <SegmentSelector
                    onSegmentSelect={(segmentId, contactCount) => {
                      setSelectedSegmentId(segmentId);
                      setSelectedSegmentCount(contactCount);
                    }}
                    selectedSegmentId={selectedSegmentId}
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Import from CSV</h3>
                  <CSVImport
                    onImport={(recipients) => {
                      setRecipients(recipients);
                      toast.success(`Imported ${recipients.length} recipients`);
                    }}
                  />
                </div>

                {(selectedSegmentId || recipients.length > 0) && (
                  <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                    {selectedSegmentId && (
                      <p className="font-medium">
                        {selectedSegmentCount} contact{selectedSegmentCount !== 1 ? "s" : ""} from segment
                      </p>
                    )}
                    {recipients.length > 0 && (
                      <p className="font-medium">
                        {recipients.length} recipient{recipients.length !== 1 ? "s" : ""} from CSV
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Total: {(selectedSegmentCount || 0) + recipients.length} recipient{(selectedSegmentCount || 0) + recipients.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 5: Schedule */}
          {currentStep === 5 && (
            <Card>
              <CardHeader>
                <CardTitle>Schedule (Optional)</CardTitle>
                <CardDescription>
                  Schedule this campaign for later or send immediately
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Send Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !scheduledDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {scheduledDate ? (
                          format(scheduledDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={scheduledDate}
                        onSelect={setScheduledDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {scheduledDate && (
                  <div>
                    <Label>Send Time</Label>
                    <Input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    />
                  </div>
                )}
                {!scheduledDate && (
                  <p className="text-sm text-muted-foreground">
                    Leave empty to send immediately after creation
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 6: Review */}
          {currentStep === 6 && (
            <Card>
              <CardHeader>
                <CardTitle>Review & Create</CardTitle>
                <CardDescription>
                  Review your campaign settings before creating
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Campaign Name:</span>
                    <span className="font-medium">{form.watch("name")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Template:</span>
                    <span className="font-medium">
                      {selectedTemplate?.name || "Not selected"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subject:</span>
                    <span className="font-medium">{form.watch("subject")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recipients:</span>
                    <span className="font-medium">
                      {recipients.length} recipient{recipients.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Send Time:</span>
                    <span className="font-medium">
                      {scheduledDate && scheduledTime
                        ? format(
                            new Date(
                              `${format(scheduledDate, "yyyy-MM-dd")}T${scheduledTime}`
                            ),
                            "PPP p"
                          )
                        : "Immediately"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            {currentStep < 6 ? (
              <Button type="button" onClick={nextStep}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  "Creating..."
                ) : scheduledDate ? (
                  <>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Schedule Campaign
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Create & Send
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}

