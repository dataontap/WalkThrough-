import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, X, Info, Wand2, Eye, EyeOff, Loader2 } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

const stepSchema = z.object({
  stepNumber: z.number(),
  actionType: z.enum(["click", "type", "wait", "navigate", "tooltip"]),
  targetElement: z.string().min(1, "Target element is required"),
  instructions: z.string().min(1, "Instructions are required"),
  data: z.any().optional()
});

const createWalkthroughFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  targetApp: z.string().min(1, "Target application is required"),
  targetUrl: z.string().url("Please enter a valid URL"),
  userType: z.string().min(1, "User type is required"),
  environment: z.string().min(1, "Environment is required"),
  createdBy: z.number().default(1), // Default to admin user for now
  status: z.string().default("draft"),
  steps: z.array(stepSchema).optional()
});

type CreateWalkthroughForm = z.infer<typeof createWalkthroughFormSchema>;

interface CreateWalkthroughModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWalkthroughModal({ open, onOpenChange }: CreateWalkthroughModalProps) {
  const { toast } = useToast();
  const [showSteps, setShowSteps] = useState(false);
  const [aiSuggested, setAiSuggested] = useState(false);
  
  const form = useForm<CreateWalkthroughForm>({
    resolver: zodResolver(createWalkthroughFormSchema),
    defaultValues: {
      title: "",
      description: "",
      targetApp: "",
      targetUrl: "",
      userType: "",
      environment: "",
      createdBy: 1,
      status: "draft",
      steps: []
    }
  });

  const { fields: steps, append: addStep, remove: removeStep, replace: replaceSteps } = useFieldArray({
    control: form.control,
    name: "steps"
  });

  // Mutation to generate AI step suggestions
  const generateStepsMutation = useMutation({
    mutationFn: async (data: { description: string; targetApp: string; targetUrl: string }) => {
      const response = await apiRequest('/api/generate-steps', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.steps && Array.isArray(data.steps)) {
        replaceSteps(data.steps);
        setAiSuggested(true);
        setShowSteps(true);
        toast({
          title: "AI Steps Generated!",
          description: `Generated ${data.steps.length} steps for your walkthrough. Review and customize as needed.`
        });
      }
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Could not generate step suggestions. Please try again or add steps manually.",
        variant: "destructive"
      });
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateWalkthroughForm) => {
      const response = await apiRequest('/api/walkthroughs', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/walkthroughs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      onOpenChange(false);
      form.reset();
      setShowSteps(false);
      setAiSuggested(false);
      toast({
        title: "Success",
        description: "Walkthrough created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create walkthrough",
        variant: "destructive",
      });
    }
  });

  // Handle AI step generation
  const handleGenerateSteps = () => {
    const description = form.getValues('description');
    const targetApp = form.getValues('targetApp');
    const targetUrl = form.getValues('targetUrl');

    if (!description || !targetApp || !targetUrl) {
      toast({
        title: "Missing Information",
        description: "Please fill in description, target app, and URL before generating steps.",
        variant: "destructive"
      });
      return;
    }

    generateStepsMutation.mutate({ description, targetApp, targetUrl });
  };

  const handleAddStep = () => {
    addStep({
      stepNumber: steps.length + 1,
      actionType: "click",
      targetElement: "",
      instructions: "",
      data: null
    });
  };

  const onSubmit = (data: CreateWalkthroughForm) => {
    console.log('Form submission data:', data);
    console.log('Form validation errors:', form.formState.errors);
    
    // Ensure step numbers are correct
    const stepsWithNumbers = data.steps?.map((step, index) => ({
      ...step,
      stepNumber: index + 1
    })) || [];
    
    const submitData = {
      ...data,
      steps: stepsWithNumbers
    };
    
    console.log('Final submit data:', submitData);
    createMutation.mutate(submitData);
  };

  const saveDraft = () => {
    const formData = form.getValues();
    onSubmit(formData);
  };

  const createAndActivate = () => {
    const formData = form.getValues();
    onSubmit({ ...formData, status: "active" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Walkthrough</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-neutral-800">Basic Information</h4>
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Walkthrough Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., CRM User Onboarding" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        rows={3} 
                        placeholder="Brief description of what this walkthrough covers" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetApp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Application</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an application" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="salesforce">Salesforce CRM</SelectItem>
                        <SelectItem value="hubspot">HubSpot</SelectItem>
                        <SelectItem value="monday">Monday.com</SelectItem>
                        <SelectItem value="slack">Slack</SelectItem>
                        <SelectItem value="custom">Custom Application</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://app.example.com/login" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* AI Step Generation Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-neutral-800">AI Step Generation</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateSteps}
                  disabled={generateStepsMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {generateStepsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  {generateStepsMutation.isPending ? 'Generating...' : 'Generate Steps'}
                </Button>
              </div>
              
              <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                <CardContent className="p-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">AI-Powered Step Generation</span>
                  </div>
                  <p className="text-sm text-purple-700 mb-3">
                    Fill in the description, target app, and URL above, then click "Generate Steps" to create an AI-powered action plan. You can review and customize the suggested steps before finalizing your walkthrough.
                  </p>
                  {aiSuggested && (
                    <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-2 py-1 rounded">
                      <span>✓ AI steps generated successfully - review below</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* User Credentials */}
            <div className="space-y-4">
              <h4 className="font-medium text-neutral-800">User Credentials</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="userType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select user type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Admin User</SelectItem>
                          <SelectItem value="standard">Standard User</SelectItem>
                          <SelectItem value="guest">Guest User</SelectItem>
                          <SelectItem value="power">Power User</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="environment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Environment</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select environment" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="production">Production</SelectItem>
                          <SelectItem value="staging">Staging</SelectItem>
                          <SelectItem value="development">Development</SelectItem>
                          <SelectItem value="demo">Demo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-2">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                    <p className="text-sm text-blue-700">
                      Credentials are securely encrypted and only used during walkthrough execution. 
                      They are never stored in plain text.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Walkthrough Steps */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-neutral-800">Walkthrough Steps</h4>
                <Button type="button" onClick={handleAddStep} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Step
                </Button>
              </div>

              {steps.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-neutral-500 mb-4">No steps added yet</p>
                    <Button type="button" onClick={handleAddStep} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Step
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <Card key={step.id} className="border-neutral-200">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">Step {index + 1}</Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStep(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <FormField
                            control={form.control}
                            name={`steps.${index}.actionType`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">Action Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="click">Click Element</SelectItem>
                                    <SelectItem value="type">Type Text</SelectItem>
                                    <SelectItem value="wait">Wait for Element</SelectItem>
                                    <SelectItem value="navigate">Navigate to URL</SelectItem>
                                    <SelectItem value="tooltip">Show Tooltip</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`steps.${index}.targetElement`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">Target Element</FormLabel>
                                <FormControl>
                                  <Input 
                                    className="text-sm" 
                                    placeholder="CSS selector or element description" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name={`steps.${index}.instructions`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">Instructions</FormLabel>
                              <FormControl>
                                <Input 
                                  className="text-sm" 
                                  placeholder="User-friendly description of this step" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-neutral-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={saveDraft}
                disabled={createMutation.isPending}
              >
                Save Draft
              </Button>
              <Button
                type="button"
                onClick={createAndActivate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create Walkthrough"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
