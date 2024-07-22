import { DataSourceClient } from "../models/dataSourceClient.model";
import { KnexTedious } from "../clients/knex/knexTedious";
import { DataSource, DataSourceClientType } from "@kottster/common";
import { KnexMysql2 } from "../clients/knex/knexMysql2";
import { KnexPg } from "../clients/knex/knexPG";
import { Knex } from "knex";

export class DataSourceManager {
  static getClient(dataSource: DataSource): DataSourceClient {
    const { clientType, client } = dataSource;
    
    switch (clientType) {
      case DataSourceClientType.knex_pg:
        return new KnexPg(client as Knex);
      case DataSourceClientType.knex_mysql2:
        return new KnexMysql2(client as Knex);
      case DataSourceClientType.knex_tedious:
        return new KnexTedious(client as Knex);
      default:
        throw new Error(`Data source client ${clientType} not supported`);
    }
  }
}