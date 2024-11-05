// entities/ProductEntity.ts
export default class ProductEntity {
    constructor(
      public name: string,
      public price: number,
      public description: string,
      public stock: number
    ) {}
  }
  