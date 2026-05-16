import type { Meta, StoryObj } from "@storybook/react";
import { CatalogFilters, CatalogPendingProvider } from "./catalog-filters";

const meta: Meta<typeof CatalogFilters> = {
  title: "Components/Layout/CatalogFilters",
  component: CatalogFilters,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Catalog search and filter toolbar. Manages query, genre, rodent type, and sort via URL params using `useRouter` + `useSearchParams`. Wrap in `CatalogPendingProvider` so filter changes can dim results during navigation.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof CatalogFilters>;

const genres = ["Action", "Animation", "Comedy", "Drama", "Horror", "Thriller"];
const rodentTypes = ["rat", "mouse", "squirrel", "hamster"];

export const Default: Story = {
  render: () => (
    <CatalogPendingProvider>
      <CatalogFilters
        availableGenres={genres}
        availableRodentTypes={rodentTypes}
        defaultQuery=""
        totalResults={142}
        totalCatalog={142}
      />
    </CatalogPendingProvider>
  ),
};

export const WithActiveSearch: Story = {
  render: () => (
    <CatalogPendingProvider>
      <CatalogFilters
        availableGenres={genres}
        availableRodentTypes={rodentTypes}
        defaultQuery="ratatouille"
        totalResults={3}
        totalCatalog={142}
      />
    </CatalogPendingProvider>
  ),
};

export const FewGenres: Story = {
  render: () => (
    <CatalogPendingProvider>
      <CatalogFilters
        availableGenres={["Animation", "Comedy"]}
        availableRodentTypes={rodentTypes}
        defaultQuery=""
        totalResults={28}
        totalCatalog={142}
      />
    </CatalogPendingProvider>
  ),
};
