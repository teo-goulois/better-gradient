import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import {
  type GetGradientsValidator,
  deleteGradientValidator,
  getGradientsValidator,
  saveGradientValidator,
  updateGradientValidator,
} from "../validators/validator.gradient";

export const getTotalExportsFromDb = createServerFn({
  method: "GET",
}).handler(async () => {
  const { getTotalExportsFromDbData } =
    await import("@/lib/server/gradient-service");
  return getTotalExportsFromDbData();
});

export const getTotalExportsFromDbQueryOptions = () =>
  queryOptions({
    queryKey: ["getTotalExportsFromDbQueryOptions"],
    queryFn: () => getTotalExportsFromDb(),
    refetchInterval: 1000 * 60 * 5,
  });

export const getPublicGradientsFromDb = createServerFn({
  method: "GET",
}).handler(async () => {
  const { getPublicGradientsFromDbData } =
    await import("@/lib/server/gradient-service");
  return getPublicGradientsFromDbData();
});

export const getPublicGradientsFromDbQueryOptions = () =>
  queryOptions({
    queryKey: ["getPublicGradientsFromDbQueryOptions"],
    queryFn: () => getPublicGradientsFromDb(),
  });

export const saveGradientToDb = createServerFn({
  method: "POST",
})
  .inputValidator((data: unknown) => saveGradientValidator.parse(data))
  .handler(async ({ data }) => {
    const { saveGradientToDbData } =
      await import("@/lib/server/gradient-service");
    return saveGradientToDbData(data);
  });

export const updateGradientStatusInDb = createServerFn({
  method: "POST",
})
  .inputValidator((data: unknown) => updateGradientValidator.parse(data))
  .handler(async ({ data }) => {
    const { updateGradientStatusInDbData } =
      await import("@/lib/server/gradient-service");
    return updateGradientStatusInDbData(data);
  });

export const deleteGradientFromDb = createServerFn({
  method: "POST",
})
  .inputValidator((data: unknown) => deleteGradientValidator.parse(data))
  .handler(async ({ data }) => {
    const { deleteGradientFromDbData } =
      await import("@/lib/server/gradient-service");
    return deleteGradientFromDbData(data);
  });

export const getGradientsFromDb = createServerFn({
  method: "GET",
})
  .inputValidator((data: unknown) => getGradientsValidator.parse(data))
  .handler(async ({ data }) => {
    const { getGradientsFromDbData } =
      await import("@/lib/server/gradient-service");
    return getGradientsFromDbData(data);
  });

export const getGradientsFromDbQueryOptions = (input: GetGradientsValidator) =>
  queryOptions({
    queryKey: ["getGradientsFromDbQueryOptions", input],
    queryFn: () => getGradientsFromDb({ data: input }),
  });

export type GradientsPage = Awaited<ReturnType<typeof getGradientsFromDb>>;

export const getInfiniteGradientsFromDbQueryOptions = (
  input: Omit<GetGradientsValidator, "page">,
) =>
  queryOptions({
    queryKey: ["getInfiniteGradientsFromDbQueryOptions", input],
    queryFn: async () => {
      return getGradientsFromDb({ data: { ...input, page: 1 } });
    },
  });

export const getGradientsInfiniteOptions = (
  input: Omit<GetGradientsValidator, "page">,
) => ({
  queryKey: ["gradientsInfinite", input] as const,
  queryFn: ({ pageParam }: { pageParam?: unknown }) =>
    getGradientsFromDb({
      data: { ...input, page: (pageParam as number) ?? 1 },
    }),
  initialPageParam: 1,
  getNextPageParam: (
    lastPage: Awaited<ReturnType<typeof getGradientsFromDb>>,
    _allPages: Array<Awaited<ReturnType<typeof getGradientsFromDb>>>,
    lastPageParam: unknown,
  ) => {
    return lastPage.gradients.length < input.limit
      ? undefined
      : (lastPageParam as number) + 1;
  },
});
