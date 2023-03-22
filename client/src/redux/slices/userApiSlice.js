import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const balanceApi = createApi({
  // name
  reducerPath: "balanceApi",
  //   source from where to fetch data from
  baseQuery: fetchBaseQuery({
    baseUrl: "https://not-robin-hood-server.vercel.app/",
  }),
  // list of queries
  endpoints: (builder) => ({
    getBalance: builder.query({
      query: () => "balance",
    }),
    addBalance: builder.mutation({
      query: (amount) => ({
        url: "balance",
        method: "PUT",
        body: { amount },
      }),
    }),
  }),
});

export const { useGetBalanceQuery, useAddBalanceMutation } = balanceApi;