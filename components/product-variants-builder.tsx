"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

type PriceTierDraft = {
  minQuantity: string;
  maxQuantity: string;
  unitPrice: string;
  currency: string;
};

type VariantDraft = {
  name: string;
  sku: string;
  priceTiers: PriceTierDraft[];
};

type ProductVariantsBuilderProps = {
  initialVariants?: VariantDraft[];
};

function createPriceTier(): PriceTierDraft {
  return {
    minQuantity: "1",
    maxQuantity: "",
    unitPrice: "",
    currency: "USD"
  };
}

function createVariant(index: number): VariantDraft {
  return {
    name: index === 0 ? "默认规格" : "",
    sku: "",
    priceTiers: [createPriceTier()]
  };
}

export function ProductVariantsBuilder({ initialVariants }: ProductVariantsBuilderProps) {
  const [variants, setVariants] = useState<VariantDraft[]>(
    initialVariants?.length ? initialVariants : [createVariant(0)]
  );
  const variantsJson = useMemo(() => JSON.stringify(variants), [variants]);

  function updateVariant(index: number, key: keyof VariantDraft, value: string) {
    setVariants((current) =>
      current.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [key]: value } : variant
      )
    );
  }

  function updateTier(
    variantIndex: number,
    tierIndex: number,
    key: keyof PriceTierDraft,
    value: string
  ) {
    setVariants((current) =>
      current.map((variant, currentVariantIndex) => {
        if (currentVariantIndex !== variantIndex) {
          return variant;
        }

        return {
          ...variant,
          priceTiers: variant.priceTiers.map((tier, currentTierIndex) =>
            currentTierIndex === tierIndex ? { ...tier, [key]: value } : tier
          )
        };
      })
    );
  }

  function addTier(variantIndex: number) {
    setVariants((current) =>
      current.map((variant, currentVariantIndex) =>
        currentVariantIndex === variantIndex
          ? { ...variant, priceTiers: [...variant.priceTiers, createPriceTier()] }
          : variant
      )
    );
  }

  function removeTier(variantIndex: number, tierIndex: number) {
    setVariants((current) =>
      current.map((variant, currentVariantIndex) =>
        currentVariantIndex === variantIndex
          ? {
              ...variant,
              priceTiers: variant.priceTiers.filter(
                (_, currentTierIndex) => currentTierIndex !== tierIndex
              )
            }
          : variant
      )
    );
  }

  return (
    <div className="variant-builder">
      <input name="variantsJson" type="hidden" value={variantsJson} />
      {variants.map((variant, variantIndex) => (
        <div className="variant-card" key={variantIndex}>
          <div className="variant-card-header">
            <strong>SKU {variantIndex + 1}</strong>
            <button
              className="icon-button"
              disabled={variants.length === 1}
              onClick={() =>
                setVariants((current) =>
                  current.filter((_, currentIndex) => currentIndex !== variantIndex)
                )
              }
              title="删除 SKU"
              type="button"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div className="variant-fields">
            <label>
              <span>规格名称</span>
              <input
                onChange={(event) => updateVariant(variantIndex, "name", event.target.value)}
                placeholder="如 Black / 500ml / Model A"
                value={variant.name}
              />
            </label>
            <label>
              <span>SKU 编码</span>
              <input
                onChange={(event) => updateVariant(variantIndex, "sku", event.target.value)}
                placeholder="内部或客户可见编码"
                value={variant.sku}
              />
            </label>
          </div>
          <div className="price-tier-list">
            {variant.priceTiers.map((tier, tierIndex) => (
              <div className="price-tier-row" key={tierIndex}>
                <label>
                  <span>起订量</span>
                  <input
                    min="1"
                    onChange={(event) =>
                      updateTier(variantIndex, tierIndex, "minQuantity", event.target.value)
                    }
                    type="number"
                    value={tier.minQuantity}
                  />
                </label>
                <label>
                  <span>封顶数量</span>
                  <input
                    min="1"
                    onChange={(event) =>
                      updateTier(variantIndex, tierIndex, "maxQuantity", event.target.value)
                    }
                    placeholder="留空为以上"
                    type="number"
                    value={tier.maxQuantity}
                  />
                </label>
                <label>
                  <span>单价</span>
                  <input
                    min="0"
                    onChange={(event) =>
                      updateTier(variantIndex, tierIndex, "unitPrice", event.target.value)
                    }
                    step="0.01"
                    type="number"
                    value={tier.unitPrice}
                  />
                </label>
                <label>
                  <span>币种</span>
                  <input
                    onChange={(event) =>
                      updateTier(variantIndex, tierIndex, "currency", event.target.value)
                    }
                    value={tier.currency}
                  />
                </label>
                <button
                  className="icon-button"
                  disabled={variant.priceTiers.length === 1}
                  onClick={() => removeTier(variantIndex, tierIndex)}
                  title="删除价格阶梯"
                  type="button"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <button className="quiet-button fit-button" onClick={() => addTier(variantIndex)} type="button">
            <Plus size={16} />
            添加价格阶梯
          </button>
        </div>
      ))}
      <button
        className="secondary-link fit-button"
        onClick={() => setVariants((current) => [...current, createVariant(current.length)])}
        type="button"
      >
        <Plus size={16} />
        添加 SKU
      </button>
    </div>
  );
}
