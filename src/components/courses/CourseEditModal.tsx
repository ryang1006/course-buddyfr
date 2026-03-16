import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient"; // Adjust this import based on your actual supabase client path
import { X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";

// 1. Zod Schema
const courseSchema = z.object({
  official_code: z.string().min(2, "Course code is too short").max(20, "Course code is too long"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  department: z.array(z.string()).min(1, "Select at least one department"),
  aliases: z.array(z.string()),
  manually_edited: z.boolean(),
});

type CourseFormValues = z.infer<typeof courseSchema>;

interface CourseEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: {
    id: string;
    official_code: string;
    title: string;
    department: string[];
    aliases: string[] | null;
    manually_edited: boolean;
  };
}

const AVAILABLE_DEPTS = ["CS", "IT", "IS"];

export default function CourseEditModal({ isOpen, onClose, course }: CourseEditModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [aliasInput, setAliasInput] = useState("");

  // 2. Initialize Form with existing data
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      official_code: course.official_code,
      title: course.title,
      department: course.department || [],
      aliases: course.aliases || [],
      manually_edited: true, // Force to true on edit so the Python script respects the manual change
    },
  });

  // 3. Database Mutation
  const updateCourseMutation = useMutation({
    mutationFn: async (values: CourseFormValues) => {
      const { data, error } = await supabase
        .from("courses")
        .update({
          official_code: values.official_code.toUpperCase(),
          title: values.title,
          department: values.department,
          aliases: values.aliases,
          manually_edited: values.manually_edited,
        })
        .eq("id", course.id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Refresh UI data automatically
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast({
        title: "Course Updated",
        description: "The course and its aliases have been successfully updated.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "An error occurred while updating.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: CourseFormValues) => {
    updateCourseMutation.mutate(values);
  };

  // 4. Tag Input Handler for Aliases
  const handleAddAlias = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newAlias = aliasInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, ""); // Match python normalization
      
      if (newAlias && !form.getValues("aliases").includes(newAlias)) {
        form.setValue("aliases", [...form.getValues("aliases"), newAlias]);
      }
      setAliasInput("");
    }
  };

  const removeAlias = (aliasToRemove: string) => {
    const currentAliases = form.getValues("aliases");
    form.setValue("aliases", currentAliases.filter((a) => a !== aliasToRemove));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Course Details</DialogTitle>
          <DialogDescription>
            Update course codes, link typo aliases, or lock this course from future spreadsheet overwrites.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* OFFICIAL CODE & TITLE */}
            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="official_code"
                render={({ field }) => (
                  <FormItem className="col-span-1">
                    <FormLabel>Course Code</FormLabel>
                    <FormControl>
                      <Input {...field} className="uppercase" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <FormLabel>Course Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* DEPARTMENTS (Checkboxes) */}
            <FormField
              control={form.control}
              name="department"
              render={() => (
                <FormItem>
                  <div className="mb-2">
                    <FormLabel>Departments</FormLabel>
                  </div>
                  <div className="flex gap-4">
                    {AVAILABLE_DEPTS.map((dept) => (
                      <FormField
                        key={dept}
                        control={form.control}
                        name="department"
                        render={({ field }) => {
                          return (
                            <FormItem key={dept} className="flex flex-row items-start space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(dept)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, dept])
                                      : field.onChange(field.value?.filter((value) => value !== dept));
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">{dept}</FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ALIASES (Tag Input) */}
            <FormField
              control={form.control}
              name="aliases"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Typo Catcher (Aliases)</FormLabel>
                  <FormDescription>
                    Type old codes or typos (e.g., "CSSS121") and press Enter. Future uploads with these typos will auto-link to this course.
                  </FormDescription>
                  <FormControl>
                    <Input
                      placeholder="Type alias and press Enter..."
                      value={aliasInput}
                      onChange={(e) => setAliasInput(e.target.value)}
                      onKeyDown={handleAddAlias}
                    />
                  </FormControl>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {field.value.map((alias) => (
                      <Badge key={alias} variant="secondary" className="flex items-center gap-1 text-sm">
                        {alias}
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-red-500"
                          onClick={() => removeAlias(alias)}
                        />
                      </Badge>
                    ))}
                    {field.value.length === 0 && (
                      <span className="text-xs text-muted-foreground italic">No aliases tracked yet.</span>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* MANUALLY EDITED LOCK */}
            <FormField
              control={form.control}
              name="manually_edited"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Lock from Spreadsheet Overwrite</FormLabel>
                    <FormDescription>
                      Prevent new Acquisitions from reverting these changes.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateCourseMutation.isPending}>
                {updateCourseMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}