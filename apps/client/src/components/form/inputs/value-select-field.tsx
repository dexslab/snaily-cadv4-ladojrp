import * as React from "react";
import { AnyValue, ValueType } from "@snailycad/types";
import { useFormikContext } from "formik";
import { useLoadValuesClientSide } from "hooks/useLoadValuesClientSide";
import { AsyncListSearchField, Item } from "@snailycad/ui";
import type { Node } from "@react-types/shared";
import { getValueStrFromValue } from "lib/admin/values/utils";

let hasFetched = false;

interface Props<T extends AnyValue> {
  fieldName: string;
  valueType: ValueType;
  values: T[];
  label: string;
  filterFn?(value: T, index: number): boolean;
  className?: string;
  onSelectionChange?(value: T | null): void;

  isClearable?: boolean;
  isOptional?: boolean;
  isDisabled?: boolean;
}

export function ValueSelectField<T extends AnyValue>(props: Props<T>) {
  const { values, errors, setValues } = useFormikContext<any>();

  const getDefaultSearchValue = React.useCallback(() => {
    const value = props.values.find((v) => v.id === values[props.fieldName]);
    return value ? getValueStrFromValue(value) : "";
  }, [props.fieldName, props.values]); // eslint-disable-line

  const [search, setSearch] = React.useState<string>(() => getDefaultSearchValue());

  useLoadValuesClientSide({
    enabled: !hasFetched,
    valueTypes: [ValueType.ADDRESS],
  });

  React.useEffect(() => {
    hasFetched = true;

    setSearch(() => getDefaultSearchValue());
  }, [getDefaultSearchValue]);

  function handleSuggestionPress({
    node,
    localValue,
  }: {
    node?: Node<T> | null;
    localValue?: string;
  }) {
    // when the menu closes, it will set the `searchValue` to `""`. We want to keep the value of the search
    if (typeof node === "undefined" && typeof localValue === "undefined") {
      return;
    }

    if (typeof localValue !== "undefined") {
      setSearch(localValue);
    }

    const fieldData = { [props.fieldName]: node?.key ?? null };
    setValues({ ...values, ...fieldData });
    props.onSelectionChange?.(node?.value ?? null);
  }

  return (
    <AsyncListSearchField<AnyValue>
      className={props.className}
      filterFn={props.filterFn}
      placeholder="Select..."
      isClearable={props.isClearable}
      menuClassName="min-w-[350px] right-0"
      isDisabled={props.isDisabled}
      selectedKey={values[props.fieldName]}
      allowsCustomValue
      defaultItems={props.values}
      label={props.label}
      isOptional={props.isOptional}
      errorMessage={errors[props.fieldName] as string}
      localValue={search}
      inputValue={search}
      setValues={handleSuggestionPress}
      fetchOptions={{
        filterTextRequired: false,
        apiPath(inputValue) {
          return `/admin/values/${props.valueType.toLowerCase()}/search?query=${inputValue}`;
        },
      }}
    >
      {(item) => {
        const textValue = getValueStrFromValue(item);

        return (
          <Item key={item.id} textValue={textValue}>
            {textValue}
          </Item>
        );
      }}
    </AsyncListSearchField>
  );
}
