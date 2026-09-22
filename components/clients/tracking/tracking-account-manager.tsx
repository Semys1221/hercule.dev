import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CLIENT_ACCOUNT_MANAGER } from "@/lib/clients/account-manager";

export function TrackingAccountManager() {
  return (
    <section aria-labelledby="account-manager-heading" className="flex items-start gap-4">
      <Avatar className="size-14 border border-border">
        <AvatarImage
          src={CLIENT_ACCOUNT_MANAGER.avatarSrc}
          alt={CLIENT_ACCOUNT_MANAGER.name}
        />
        <AvatarFallback>TV</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col gap-1">
        <p id="account-manager-heading" className="text-sm text-muted-foreground">
          {CLIENT_ACCOUNT_MANAGER.role}
        </p>
        <p className="text-sm font-medium text-foreground">{CLIENT_ACCOUNT_MANAGER.name}</p>
        <p className="text-sm text-muted-foreground">{CLIENT_ACCOUNT_MANAGER.availability}</p>
      </div>
    </section>
  );
}
