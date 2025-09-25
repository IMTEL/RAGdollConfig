import { Textarea } from "@/components/ui/textarea"

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"



interface AgentBasePropmtProps {
    prompt: string,
    onChange?: (prompt: string) => void;
    maxLength: number
}

export function AgentBasePrompt({ prompt, onChange, maxLength }: AgentBasePropmtProps) {

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value
        onChange?.(text)
    }

    return (

        <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
                <AccordionTrigger>Edit Base Prompt</AccordionTrigger>
                <AccordionContent>
                    <Textarea
                        placeholder="Write the agents base prompt here"
                        maxLength={maxLength}
                        value={prompt}
                        onChange={handleChange}
                    />
                </AccordionContent>
            </AccordionItem>
        </Accordion>


    )

}