import { TransactionListResponse } from "./../types/transaction/response/TransactionListResponse";
import { Transaction } from "./../entities/Transaction";
import { GetTransactionInput } from "./../types/transaction/args/GetTransactionInput";
import { Arg, Query, Resolver } from "type-graphql";
import { OutOfBoundsError } from "../types/Errors";
import { Between } from "typeorm";

@Resolver()
export class TransactionResolver {
  @Query((_returns) => TransactionListResponse)
  async getTransactions(
    @Arg("input")
    { limit, page, orderBy, fromDate, toDate }: GetTransactionInput
  ): Promise<TransactionListResponse> {
    try {
      let options = {
        ...(fromDate &&
          toDate && {
            createdAt: Between(fromDate, toDate),
          }),
      };

      const [result, total] = await Transaction.findAndCount({
        order: { createdAt: orderBy },
        take: limit,
        where: options,
        skip: (page - 1) * limit,
        relations: ["user"],
      });

      const totalPages = Math.ceil(total / limit);
      if (totalPages > 0 && page > totalPages)
        throw new Error(OutOfBoundsError);

      return {
        message: "Get Transactions successfully",
        items: result,
        page,
        total,
        totalPages,
      };
    } catch (error) {
      throw new Error(error);
    }
  }
}
