import { cn } from "@/lib/utils"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

export interface TestimonialAuthor {
    name: string
    handle: string
    avatar: string
}

export interface TestimonialCardProps {
    author: TestimonialAuthor
    text: string
    href?: string
    className?: string
}

export function TestimonialCard({
    author,
    text,
    href,
    className
}: TestimonialCardProps) {
    const Card = href ? 'a' : 'div'

    return (
        <Card
            {...(href ? { href } : {})}
            className={cn(
                "flex flex-col rounded-xl border border-border/50",
                "bg-card text-card-foreground",
                "p-4 text-start sm:p-6",
                "shadow-sm hover:shadow-md",
                "max-w-[320px] sm:max-w-[320px]",
                "transition-all duration-300 ease-out hover:-translate-y-1",
                className
            )}
        >
            <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={author.avatar} alt={author.name} />
                    <AvatarFallback>{author.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                    <h3 className="text-md font-semibold leading-none text-foreground">
                        {author.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {author.handle}
                    </p>
                </div>
            </div>
            <p className="sm:text-md mt-4 text-sm text-muted-foreground">
                {text}
            </p>
        </Card>
    )
}
