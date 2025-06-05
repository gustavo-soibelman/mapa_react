import React, { useState, useEffect, useRef } from 'react';
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';

const ALL_OPTION = { value: '__all__', label: 'Todos' };

const slugify = (text) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .toLowerCase();

/**
 * @param {{ options: { value: string, label: string }[], allowCreate?: boolean, queryKey?: string }} props
 */
const CustomMultiSelect = ({ options = [], allowCreate = false, queryKey = 'valores' }) => {
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const selectRef = useRef(null);

  const allOptions = [ALL_OPTION, ...options];

  const createOption = (text) => ({
    label: text,
    value: slugify(text),
  });

  const addOptionsFromText = (text) => {
    const items = text
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map(createOption);

    setSelectedOptions((prev) => {
      const existing = new Set(prev.map((opt) => opt.value));
      const semTodos = prev.filter((opt) => opt.value !== ALL_OPTION.value);
      const newUnique = items.filter((opt) => !existing.has(opt.value));
      return [...semTodos, ...newUnique];
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get(queryKey);
    if (raw) {
      const values = raw
        .split('+')
        .map((s) => decodeURIComponent(s.trim().toLowerCase()));

      const known = options.map((opt) => ({
        ...opt,
        value: slugify(opt.value),
      }));

      const matched = values
        .filter((val) => allowCreate || known.some((opt) => opt.value === val || val === '__all__'))
        .map((val) => {
          if (val === '__all__') return ALL_OPTION;
          const match = known.find((opt) => opt.value === val);
          return match || createOption(val);
        });

      setSelectedOptions(matched);
    }
  }, [queryKey, allowCreate, options]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (selectedOptions.length > 0) {
      const joined = selectedOptions
        .map((opt) => encodeURIComponent(opt.value))
        .join('+');
      params.set(queryKey, joined);
    } else {
      params.delete(queryKey);
    }

    const newUrl =
      window.location.pathname + '?' + params.toString() + window.location.hash;

    window.history.replaceState({}, '', newUrl);
  }, [selectedOptions, queryKey]);

  const handleChange = (newValue, actionMeta) => {
    if (!newValue) {
      setSelectedOptions([]);
      return;
    }

    const selected = [...newValue];
    const hasAll = selected.some((opt) => opt.value === ALL_OPTION.value);
    const others = selected.filter((opt) => opt.value !== ALL_OPTION.value);

    const isSelectingAll =
      actionMeta.action === 'select-option' &&
      actionMeta.option?.value === ALL_OPTION.value;

    if (isSelectingAll) {
      setSelectedOptions([ALL_OPTION]);
    } else if (hasAll && others.length > 0) {
      setSelectedOptions(others);
    } else {
      setSelectedOptions(selected);
    }
  };

  const handleKeyDown = (event) => {
    if (!allowCreate || !inputValue) return;

    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addOptionsFromText(inputValue);
      setInputValue('');
    }
  };

  const handlePaste = (event) => {
    if (!allowCreate) return;

    const pasted = event.clipboardData.getData('text');
    if (pasted.includes(',')) {
      event.preventDefault();
      addOptionsFromText(pasted);
      setInputValue('');
    }
  };

  const SelectComponent = allowCreate ? CreatableSelect : Select;

  return (
    <div style={{ width: '100%', maxWidth: '600px' }} onPaste={handlePaste}>
      <SelectComponent
        isMulti
        ref={selectRef}
        value={selectedOptions}
        onChange={(val, meta) => handleChange(val, meta)}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onKeyDown={handleKeyDown}
        options={allOptions}
        placeholder="Selecione valores..."
        isValidNewOption={() => allowCreate}
        styles={{
          menu: (provided) => ({ ...provided, zIndex: 9999 }),
          input: (provided) => ({ ...provided, whiteSpace: 'normal' }),
        }}
      />
    </div>
  );
};

export default CustomMultiSelect;
