"use client";

import { ImagePlus, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export type PriceTierDraft = {
  minQuantity: string;
  maxQuantity: string;
  unitPrice: string;
  currency: string;
};

export type VariantDraft = {
  image: string;
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
    image: "",
    name: index === 0 ? "默认规格" : "",
    sku: "",
    priceTiers: [createPriceTier()]
  };
}

export function ProductVariantsBuilder({ initialVariants }: ProductVariantsBuilderProps) {
  const imageInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [variants, setVariants] = useState<VariantDraft[]>(
    initialVariants?.length ? initialVariants : [createVariant(0)]
  );
  const initialVariantsKey = JSON.stringify(initialVariants ?? []);
  const variantsJson = useMemo(
    () =>
      JSON.stringify(
        variants.map((variant) => ({
          name: variant.name,
          sku: variant.sku,
          priceTiers: variant.priceTiers
        }))
      ),
    [variants]
  );

  useEffect(() => {
    setVariants(initialVariants?.length ? initialVariants : [createVariant(0)]);
  }, [initialVariants, initialVariantsKey]);

  function updateVariant(index: number, key: "name" | "sku", value: string) {
    setVariants((current) =>
      current.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [key]: value } : variant
      )
    );
  }

  function updateVariantImage(index: number, file?: File) {
    setVariants((current) =>
      current.map((variant, variantIndex) => {
        if (variantIndex !== index) {
          return variant;
        }

        if (variant.image.startsWith("blob:")) {
          URL.revokeObjectURL(variant.image);
        }

        return {
          ...variant,
          image: file ? URL.createObjectURL(file) : variant.image
        };
      })
    );
  }

  function clearVariantImage(index: number) {
    const input = imageInputRefs.current[index];

    if (input) {
      input.value = "";
    }

    setVariants((current) =>
      current.map((variant, variantIndex) => {
        if (variantIndex !== index) {
          return variant;
        }

        if (variant.image.startsWith("blob:")) {
          URL.revokeObjectURL(variant.image);
        }

        return {
          ...variant,
          image: ""
        };
      })
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
            <strong>规格 {variantIndex + 1}</strong>
            <button
              className="icon-button"
              disabled={variants.length === 1}
              onClick={() =>
                setVariants((current) =>
                  current.filter((_, currentIndex) => currentIndex !== variantIndex)
                )
              }
              title="删除规格"
              type="button"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div className="variant-fields">
            <div className="variant-image-field">
              <span>规格图片</span>
              <input
                name="variantExistingImages"
                type="hidden"
                value={variant.image.startsWith("blob:") ? "" : variant.image}
              />
              <input
                accept="image/*"
                className="visually-hidden"
                name="variantImages"
                onChange={(event) => updateVariantImage(variantIndex, event.target.files?.[0])}
                ref={(element) => {
                  imageInputRefs.current[variantIndex] = element;
                }}
                type="file"
              />
              <button
                className="variant-image-picker"
                onClick={() => imageInputRefs.current[variantIndex]?.click()}
                type="button"
              >
                {variant.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt={`规格 ${variantIndex + 1} 图片`} src={variant.image} />
                ) : (
                  <span>
                    <ImagePlus size={18} />
                    添加图片
                  </span>
                )}
              </button>
              {variant.image ? (
                <button
                  className="variant-image-remove"
                  onClick={() => clearVariantImage(variantIndex)}
                  title="移除规格图片"
                  type="button"
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>
            <div className="variant-meta-fields">
              <label>
                <span>规格名称</span>
                <input
                  onChange={(event) => updateVariant(variantIndex, "name", event.target.value)}
                  placeholder="如 Black / 500ml / Model A"
                  value={variant.name}
                />
              </label>
              <label>
                <span>型号 / 编码</span>
                <input
                  onChange={(event) => updateVariant(variantIndex, "sku", event.target.value)}
                  placeholder="如 Model A / SKU-001"
                  value={variant.sku}
                />
              </label>
            </div>
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
        添加规格
      </button>
    </div>
  );
}
