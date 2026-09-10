"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  domainLabel,
  licenseLabel,
} from "@/features/forms/constants/publicationMetadataOptions";
import type { PublishedSchemaCardDTO } from "@/features/forms/types";

interface ExploreClientProps {
  schemas: PublishedSchemaCardDTO[];
}

const PAGE_SIZE = 10;

function contributorNamesLabel(schema: PublishedSchemaCardDTO): string {
  if (schema.contributors.length === 0) return schema.authorName ?? "Unknown";
  return schema.contributors.map((contributor) => contributor.name || "Unnamed").join(", ");
}

function publishedOnLabel(createdAt: Date): string {
  return new Date(createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ExploreClient({ schemas }: ExploreClientProps) {
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Reset pagination when the search term changes — a render-time state
  // adjustment (not an effect) per https://react.dev/learn/you-might-not-need-an-effect
  const [lastSearch, setLastSearch] = useState(search);
  if (search !== lastSearch) {
    setLastSearch(search);
    setVisibleCount(PAGE_SIZE);
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return schemas;

    return schemas.filter((schema) => {
      const haystack = [
        schema.title,
        schema.description ?? "",
        contributorNamesLabel(schema),
        ...schema.keywords,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [schemas, search]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-in fade-in duration-300">
      <PageHeader
        title="Explore Public Schemas"
        description="Search, view, and reuse standardized metadata templates published by the community."
      />

      <div className="max-w-4xl mx-auto">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search titles, descriptions, contributors, keywords..."
          className="mb-6"
        />

        {visible.length === 0 && (
          <p className="text-center text-base-content/60 py-12">
            No public schemas found matching your search.
          </p>
        )}

        <div className="flex flex-col gap-4">
          {visible.map((schema) => (
            <Card
              key={schema.pid}
              bordered
              className="bg-base-300 border-base-content/10 hover:shadow-lg transition-shadow"
            >
              <CardBody className="pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/schemas/${schema.pid}`} className="hover:underline">
                      <h2 className="text-xl font-bold">{schema.title}</h2>
                    </Link>
                    <Badge variant="secondary" outline size="sm" className="font-mono">
                      v{schema.version}
                    </Badge>
                    <Badge variant="primary" outline size="sm">
                      {domainLabel(schema.domain)}
                    </Badge>
                  </div>
                  <p className="text-sm text-base-content/70 mt-0">
                    {contributorNamesLabel(schema)}
                  </p>
                </div>

                {schema.description && (
                  <p className="text-base-content/85 line-clamp-3 mt-2">{schema.description}</p>
                )}

                {schema.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {schema.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="badge badge-outline badge-sm border-base-content/20 text-base-content/60"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-xs text-base-content/50">
                  {licenseLabel(schema.license)} · Published {publishedOnLabel(schema.createdAt)}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>

        {visibleCount < filtered.length && (
          <div className="flex justify-center mt-6">
            <Button variant="secondary" outline onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
              Load more
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
