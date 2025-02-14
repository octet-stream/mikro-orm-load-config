import {Entity, PrimaryKey, Property} from "@mikro-orm/better-sqlite"

@Entity()
export class User {
  @PrimaryKey({type: "int", unsigned: true, autoincrement: true})
  id!: number

  @Property({type: "string"})
  firstName!: string

  @Property({type: "string"})
  lastName!: string
}
