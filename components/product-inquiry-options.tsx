"use client";

import { useMemo, useState } from "react";

type ProductPriceTierView = {
  id: string;
  minQuantity: number;
  maxQuantity: number | null;
  unitPrice: string;
  currency: string;
};

type ProductVariantView = {
  id: string;
  name: string;
  sku: string | null;
  priceTiers: ProductPriceTierView[];
};

type ProductInquiryOptionsProps = {
  variants: ProductVariantView[];
};

export function ProductInquiryOptions({ variants }: ProductInquiryOptionsProps) {
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState("1");
  const selectedVariant = variants.find((variant) => variant.id === variantId) ?? variants[0];
  const quantityValue = Number(quantity);
  const matchedTier = useMemo(() => {
    if (!selectedVariant || !Number.isFinite(quantityValue)) {
      return null;
    }

    return (
      selectedVariant.priceTiers.find((tier) => {
        const aboveMin = quantityValue >= tier.minQuantity;
        const belowMax = tier.maxQuantity === null || quantityValue <= tier.maxQuantity;
        return aboveMin && belowMax;
      }) ?? selectedVariant.priceTiers[0] ?? null
    );
  }, [quantityValue, selectedVariant]);

  if (!selectedVariant) {
    return null;
  }

  return (
    <div className="product-option-box">
      <input name="selectedVariantId" type="hidden" value={selectedVariant.id} />
      <input name="selectedVariantName" type="hidden" value={selectedVariant.name} />
      <input name="selectedVariantSku" type="hidden" value={selectedVariant.sku ?? ""} />
      <input name="selectedQuantity" type="hidden" value={quantity} />
      <input
        name="selectedUnitPrice"
        type="hidden"
        value={matchedTier ? `${matchedTier.currency} ${matchedTier.unitPrice}` : ""}
      />
      <label>
        <span>选择 SKU</span>
        <select value={variantId} onChange={(event) => setVariantId(event.target.value)}>
          {variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.name}
              {variant.sku ? ` / ${variant.sku}` : ""}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>预计数量</span>
        <input
          min="1"
          onChange={(event) => setQuantity(event.target.value)}
          type="number"
          value={quantity}
        />
      </label>
      {matchedTier ? (
        <strong>
          {matchedTier.currency} {matchedTier.unitPrice} / 件
        </strong>
      ) : null}
      <div className="public-price-tiers">
        {selectedVariant.priceTiers.map((tier) => (
          <span key={tier.id}>
            {tier.minQuantity}
            {tier.maxQuantity ? `-${tier.maxQuantity}` : "+"}: {tier.currency} {tier.unitPrice}
          </span>
        ))}
      </div>
    </div>
  );
}
