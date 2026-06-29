import { ProductMainImagesUploader } from "@/components/product-main-images-uploader";
import { ProductRichTextEditor } from "@/components/product-rich-text-editor";
import { ProductVideoUploader } from "@/components/product-video-uploader";
import { ProductVariantsBuilder, type VariantDraft } from "@/components/product-variants-builder";

type CategoryOption = {
  id: string;
  name: string;
};

type ProductFormInitialValues = {
  id?: string;
  name?: string;
  slug?: string;
  sku?: string | null;
  categoryId?: string | null;
  summary?: string | null;
  material?: string | null;
  productType?: string | null;
  application?: string | null;
  packaging?: string | null;
  size?: string | null;
  weight?: string | null;
  composition?: string | null;
  priceNote?: string | null;
  detailHtml?: string | null;
  coverImage?: string | null;
  gallery?: string[];
  videoUrl?: string | null;
};

type ProductFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  categories: CategoryOption[];
  initialValues?: ProductFormInitialValues;
  initialVariants?: VariantDraft[];
  submitLabel: string;
};

export function ProductForm({
  action,
  categories,
  initialValues,
  initialVariants,
  submitLabel
}: ProductFormProps) {
  const initialImages = initialValues?.gallery?.length
    ? initialValues.gallery
    : initialValues?.coverImage
      ? [initialValues.coverImage]
      : [];

  return (
    <form action={action} className="product-form">
      {initialValues?.id ? <input name="productId" type="hidden" value={initialValues.id} /> : null}
      {initialValues?.slug ? <input name="slug" type="hidden" value={initialValues.slug} /> : null}

      <div className="product-form-full product-form-section">
        <span>产品主图 / 视频</span>
        <div className="product-media-uploader-row">
          <ProductMainImagesUploader initialImages={initialImages} />
          <ProductVideoUploader initialVideoUrl={initialValues?.videoUrl ?? null} />
        </div>
      </div>

      <label className="product-form-full">
        <span>品名</span>
        <input name="name" required defaultValue={initialValues?.name ?? ""} />
      </label>

      <label>
        <span>型号</span>
        <input name="sku" defaultValue={initialValues?.sku ?? ""} />
      </label>

      <label>
        <span>分类</span>
        <select name="categoryId" defaultValue={initialValues?.categoryId ?? ""}>
          <option value="">未分类</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>新分类名称</span>
        <input name="newCategoryName" placeholder="填写后优先使用" />
      </label>

      <label className="product-form-wide">
        <span>摘要</span>
        <input name="summary" defaultValue={initialValues?.summary ?? ""} />
      </label>

      <label className="product-form-wide">
        <span>价格说明</span>
        <input
          name="priceNote"
          defaultValue={initialValues?.priceNote ?? ""}
          placeholder="如 MOQ / FOB / 面议"
        />
      </label>

      <div className="product-form-full product-form-section">
        <span>产品参数</span>
        <div className="product-spec-fields">
          <label>
            <span>材料</span>
            <input name="material" defaultValue={initialValues?.material ?? ""} />
          </label>
          <label>
            <span>类型</span>
            <input name="productType" defaultValue={initialValues?.productType ?? ""} />
          </label>
          <label>
            <span>应用</span>
            <input name="application" defaultValue={initialValues?.application ?? ""} />
          </label>
          <label>
            <span>包装</span>
            <input name="packaging" defaultValue={initialValues?.packaging ?? ""} />
          </label>
          <label>
            <span>大小</span>
            <input name="size" defaultValue={initialValues?.size ?? ""} />
          </label>
          <label>
            <span>重量</span>
            <input name="weight" defaultValue={initialValues?.weight ?? ""} />
          </label>
          <label className="product-form-wide">
            <span>成分</span>
            <input name="composition" defaultValue={initialValues?.composition ?? ""} />
          </label>
        </div>
      </div>

      <div className="product-form-full product-form-section">
        <span>规格与区间价格</span>
        <ProductVariantsBuilder initialVariants={initialVariants} />
      </div>

      <div className="product-form-full product-form-section">
        <span>详情页内容</span>
        <ProductRichTextEditor initialHtml={initialValues?.detailHtml ?? null} />
      </div>

      <button className="primary-button" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
