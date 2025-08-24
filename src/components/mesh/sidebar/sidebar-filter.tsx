"use client";
import {
  Disclosure,
  DisclosurePanel,
  DisclosureTrigger,
} from "@/components/mesh/sidebar/sidebar-disclosure";
import { IconEyeDropper, IconRefresh } from "@intentui/icons";
import { DEFAULT_FILTERS, useMeshStore } from "@/store/store-mesh";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

type Props = {};

export const SidebarFilter = ({}: Props) => {
  const { filters, setFilters } = useMeshStore();

  return (
    <div>
      <Disclosure defaultExpanded>
        <DisclosureTrigger>
          <IconEyeDropper /> Filters
        </DisclosureTrigger>
        <DisclosurePanel>
          <Slider
            label="Blur"
            value={filters.blur ?? 0}
            onChange={(v) => {
              const value = typeof v === "number" ? v : v[0];
              setFilters({ blur: value });
            }}
          />
          <Slider
            label="Grain"
            value={(filters.grain ?? 0) * 100}
            onChange={(v) => {
              const value = typeof v === "number" ? v : v[0];
              setFilters({ grain: value / 100 });
            }}
          />
          <Button
            intent="outline"
            onPress={() => setFilters(DEFAULT_FILTERS)}
            className="mt-4"
          >
            <IconRefresh /> Reset Filters
          </Button>
        </DisclosurePanel>
      </Disclosure>
    </div>
  );
};
