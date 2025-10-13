import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "../ui/form";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { AccessKey } from "./access-key-card";

const RAGDOLL_BASE_URL = process.env.NEXT_PUBLIC_RAGDOLL_BASE_URL;

const Schema = z.object({
    name: z.string().min(1, "Please enter a name."),
    expiery_date: z.date({ error: "Please pick your date of birth." }),
});

type FormValues = z.infer<typeof Schema>;

export function AccessKeyModal({
    open,
    onClose,
    onKeyAdded,
    agentId,
}: {
    open: boolean;
    onClose: () => void;
    onKeyAdded: (accessKey: AccessKey) => void
    agentId: string;
}) {
    const form = useForm<FormValues>({
        resolver: zodResolver(Schema),
        defaultValues: {
            name: "",
            expiery_date: undefined,
        },
    });

    const onSubmit = async (values: FormValues) => {
        const params = new URLSearchParams({
            name: values.name,
            expiry_date: values.expiery_date.toISOString(),
            agent_id: agentId,
        });

        const response = await fetch(RAGDOLL_BASE_URL + `/new-accesskey?${params.toString()}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        form.reset();
        onClose();

        if (!response.ok) {
            // TODO : Feedback to user
            console.error("Failed to create access key:", response.statusText);
            return
        }

        try {
            const accessKey = await response.json() as AccessKey
            onKeyAdded(accessKey)
        } catch (e) {
            console.error("Failed to create access key:", response.statusText);
            alert("An error occured while trying to create an access key");
        }
    };

    if (!open) return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            )}
            role="dialog"
            aria-modal="true"
        >
            <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-md">
                <h2 className="text-lg font-semibold mb-4">Create Api-key</h2>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="expiery_date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Expiery date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    data-empty={!field.value}
                                                    className="data-[empty=true]:text-muted-foreground w-[280px] justify-start text-left font-normal"
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {field.value ? (
                                                        format(field.value, "PPP")
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                // react-hook-form expects an actual Date or undefined
                                                onSelect={(d) => field.onChange(d ?? undefined)}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                className="px-4 py-2 rounded-md bg-muted text-foreground cursor-pointer"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 rounded-md bg-primary text-primary-foreground cursor-pointer"
                            >
                                Create
                            </button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
}
