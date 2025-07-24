import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PlayCircle, Clock, CheckCircle, XCircle, Mail, Video, Download } from "lucide-react";

const recordingSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  userPrompt: z.string().min(10, "Please provide a detailed description"),
  targetUrl: z.string().url("Please enter a valid URL"),
  email: z.string().email("Please enter a valid email")
});

type RecordingForm = z.infer<typeof recordingSchema>;

interface RecordingSession {
  id: string;
  status: 'pending' | 'recording' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
  emailSent?: boolean;
  emailError?: string;
}

export default function ApiTest() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<RecordingForm>({
    resolver: zodResolver(recordingSchema),
    defaultValues: {
      username: "",
      password: "",
      userPrompt: "",
      targetUrl: "https://",
      email: ""
    }
  });

  const { data: sessionStatus, refetch: refetchStatus } = useQuery<RecordingSession>({
    queryKey: ['/api/record', sessionId, 'status'],
    enabled: !!sessionId,
    refetchInterval: (data) => {
      // Stop polling if completed or failed
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false;
      }
      return 2000; // Poll every 2 seconds
    }
  });

  const recordMutation = useMutation({
    mutationFn: async (data: RecordingForm) => {
      const response = await apiRequest('POST', '/api/record', data);
      return response.json();
    },
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      toast({
        title: "Recording Started",
        description: "Your walkthrough recording has been initiated. You'll receive an email when it's ready.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start recording",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: RecordingForm) => {
    recordMutation.mutate(data);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'recording':
        return <PlayCircle className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'processing':
        return <PlayCircle className="h-5 w-5 text-purple-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-700';
      case 'recording':
        return 'bg-blue-100 text-blue-700';
      case 'processing':
        return 'bg-purple-100 text-purple-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-neutral-800 mb-2">Walkthrough API Test</h1>
          <p className="text-neutral-600">Test the recording API by submitting a walkthrough request</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recording Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PlayCircle className="h-5 w-5 text-primary" />
                <span>Create Recording Request</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="targetUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Website URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Login Username</FormLabel>
                        <FormControl>
                          <Input placeholder="your_username" {...field} />
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
                        <FormLabel>Login Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="your_password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="userPrompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Walkthrough Request</FormLabel>
                        <FormControl>
                          <Textarea 
                            rows={4}
                            placeholder="Describe what you want to learn. For example: 'How to create a new project and invite team members', 'How to set up billing and payment methods', etc."
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email for Notification</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your.email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={recordMutation.isPending}
                  >
                    {recordMutation.isPending ? "Starting Recording..." : "Start Recording"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Status Tracking */}
          <div className="space-y-6">
            {sessionId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span>Recording Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-600">Session ID:</span>
                    <code className="text-xs bg-neutral-100 px-2 py-1 rounded">{sessionId}</code>
                  </div>

                  {sessionStatus && (
                    <>
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(sessionStatus.status)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-neutral-800">Status</span>
                            <Badge className={`${getStatusColor(sessionStatus.status)} text-xs`}>
                              {sessionStatus.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {sessionStatus.status === 'completed' && sessionStatus.videoUrl && (
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span className="font-medium text-green-800">Recording Complete!</span>
                          </div>
                          <p className="text-green-700 text-sm mb-3">
                            Your walkthrough has been recorded and processed. 
                            {sessionStatus.emailSent 
                              ? " An email has been sent with the video link."
                              : " You can access the video using the link below."}
                          </p>
                          
                          {/* Email status indicator */}
                          {sessionStatus.emailSent === false && sessionStatus.emailError && (
                            <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded text-xs">
                              <span className="text-orange-700">
                                ⚠️ Email notification failed: {sessionStatus.emailError}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex flex-col space-y-3">
                            <div className="flex items-center space-x-2">
                              <Video className="h-4 w-4 text-green-600" />
                              <a 
                                href={sessionStatus.videoUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-800 underline text-sm"
                              >
                                View Video Tutorial
                              </a>
                            </div>
                            {sessionStatus.videoUrl?.includes('/api/recordings/') && (
                              <div className="flex items-center space-x-2">
                                <Download className="h-4 w-4 text-blue-600" />
                                <a 
                                  href={`${sessionStatus.videoUrl.replace('.mp4', '/download')}`}
                                  download
                                  className="text-blue-600 hover:text-blue-800 underline text-sm"
                                  title="Download video file (file size may be 10-50MB)"
                                >
                                  Download Video File
                                </a>
                                <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                                  ⚠️ Large file (10-50MB)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {sessionStatus.status === 'failed' && sessionStatus.error && (
                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <XCircle className="h-5 w-5 text-red-500" />
                            <span className="font-medium text-red-800">Recording Failed</span>
                          </div>
                          <p className="text-red-700 text-sm">{sessionStatus.error}</p>
                        </div>
                      )}

                      {(sessionStatus.status === 'pending' || sessionStatus.status === 'recording' || sessionStatus.status === 'processing') && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <Mail className="h-5 w-5 text-blue-500" />
                            <span className="font-medium text-blue-800">Processing in Progress</span>
                          </div>
                          <p className="text-blue-700 text-sm">
                            We're recording your walkthrough. You'll receive an email notification when it's ready.
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  <Button 
                    variant="outline" 
                    onClick={() => refetchStatus()} 
                    size="sm"
                    className="w-full"
                  >
                    Refresh Status
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* API Information */}
            <Card>
              <CardHeader>
                <CardTitle>API Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-medium text-neutral-800 mb-2">Create Recording</h4>
                  <code className="text-sm bg-neutral-100 p-2 rounded block">
                    POST /api/record
                  </code>
                </div>
                <div>
                  <h4 className="font-medium text-neutral-800 mb-2">Check Status</h4>
                  <code className="text-sm bg-neutral-100 p-2 rounded block">
                    GET /api/record/:sessionId/status
                  </code>
                </div>
                <div className="text-sm text-neutral-600">
                  <p className="mb-2"><strong>Features:</strong></p>
                  <ul className="space-y-1">
                    <li>• AI-generated scripts</li>
                    <li>• Mouse movement highlights</li>
                    <li>• Email notifications</li>
                    <li>• Voice-over generation</li>
                    <li>• Closed captions</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}