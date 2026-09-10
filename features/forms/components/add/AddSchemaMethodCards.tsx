import {
  ArrowDownTrayIcon,
  ArrowRightIcon,
  CircleStackIcon,
  CloudArrowDownIcon,
  DocumentPlusIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import type { AddSchemaMethodId } from "@/features/forms/add/sourceIds";
import type { AddSchemaMethod } from "@/features/forms/add/types";
import { cn } from "@/lib/utils";

interface AddSchemaMethodCardsProps {
  methods: readonly AddSchemaMethod[];
}

function MethodIcon({ id }: { id: AddSchemaMethodId }) {
  const className = "h-7 w-7";

  switch (id) {
    case "blank":
      return <DocumentPlusIcon className={className} aria-hidden="true" />;
    case "staple":
      return <ArrowDownTrayIcon className={className} aria-hidden="true" />;
    case "cedar":
      return <CloudArrowDownIcon className={className} aria-hidden="true" />;
    case "datacite":
      return <CircleStackIcon className={className} aria-hidden="true" />;
  }
}

function MethodCard({ method }: { method: AddSchemaMethod }) {
  const isAvailable = method.availability === "available";
  const card = (
    <Card
      bordered
      className={cn(
        "h-full transition-colors",
        isAvailable
          ? "group-hover:border-primary/60 group-hover:bg-primary/5"
          : "bg-base-200/40 opacity-65",
      )}
    >
      <CardBody className="gap-4">
        <div className="flex items-start justify-between gap-4">
          <div
            className={cn(
              "rounded-xl p-3",
              isAvailable
                ? "bg-primary/10 text-primary"
                : "bg-base-300 text-base-content/50",
            )}
          >
            <MethodIcon id={method.id} />
          </div>
          {isAvailable ? (
            <ArrowRightIcon
              className="h-5 w-5 text-base-content/40 transition-transform group-hover:translate-x-1 group-hover:text-primary"
              aria-hidden="true"
            />
          ) : (
            <span className="badge badge-ghost badge-sm">Coming soon</span>
          )}
        </div>
        <div>
          <CardTitle className="text-xl">{method.title}</CardTitle>
          <p className="mt-2 text-sm leading-relaxed text-base-content/60">
            {method.description}
          </p>
        </div>
      </CardBody>
    </Card>
  );

  if (!isAvailable) {
    return (
      <div aria-disabled="true" className="h-full cursor-not-allowed">
        {card}
      </div>
    );
  }

  return (
    <Link
      href={method.href}
      className="group block h-full rounded-box focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
    >
      {card}
    </Link>
  );
}

export function AddSchemaMethodCards({
  methods,
}: AddSchemaMethodCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {methods.map((method) => (
        <MethodCard key={method.id} method={method} />
      ))}
    </div>
  );
}
