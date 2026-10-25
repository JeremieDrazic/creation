import { Button } from '@base-ui/react/button';
import { Collapsible } from '@base-ui/react/collapsible';
import { Input } from '@base-ui/react/input';
import { Select } from '@base-ui/react/select';
import { useRef } from 'react';

import type { GuiPreset } from './preset-data';

type PresetFormProps = Readonly<{
  presets: readonly GuiPreset[];
  selectedId: string;
  name: string;
  modified: boolean;
  disabled: boolean;
  portalContainer: HTMLElement;
  translate: (key: string) => string;
  onSelect: (id: string) => void;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onRename: () => void;
  onRemove: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
}>;

function Chevron() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path
        d="m4.5 6.5 3.5 3.5 3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Presentation only: Base UI owns popup positioning, keyboard navigation and focus behavior. */
export function PresetForm(props: PresetFormProps) {
  const { translate } = props;
  const fileInput = useRef<HTMLInputElement>(null);
  const items = [
    { value: '', label: translate('presets.defaults') },
    ...props.presets.map((preset) => ({ value: preset.id, label: preset.name })),
  ];
  return (
    <div className="creation-preset-controls">
      <div className="creation-preset-heading">
        <span>{translate('presets.title')}</span>
        {props.modified && (
          <span className="creation-preset-modified">{translate('presets.modified')}</span>
        )}
      </div>
      <Select.Root<string>
        items={items}
        value={props.selectedId}
        disabled={props.disabled}
        modal={false}
        onValueChange={(value) => {
          if (value !== null) {
            props.onSelect(value);
          }
        }}
      >
        <Select.Trigger
          className="creation-preset-trigger"
          aria-label={translate('presets.select')}
        >
          <Select.Value className="creation-preset-value" />
          <Select.Icon className="creation-preset-chevron">
            <Chevron />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal container={props.portalContainer}>
          <Select.Positioner
            className="creation-preset-positioner"
            sideOffset={6}
            alignItemWithTrigger={false}
            collisionPadding={12}
          >
            <Select.Popup className="creation-preset-popup">
              <Select.List className="creation-preset-list">
                {items.map((item) => (
                  <Select.Item
                    key={item.value}
                    value={item.value}
                    className="creation-preset-option"
                  >
                    <Select.ItemIndicator className="creation-preset-check">
                      <svg
                        aria-hidden="true"
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="m3.5 8 3 3 6-6"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Select.ItemIndicator>
                    <Select.ItemText title={item.label}>{item.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
      <div className="creation-preset-save">
        <Input
          type="text"
          aria-label={translate('presets.name')}
          placeholder={translate('presets.name')}
          value={props.name}
          maxLength={64}
          disabled={props.disabled}
          onValueChange={props.onNameChange}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && props.name.trim()) {
              props.onSave();
            }
          }}
        />
        <Button
          className="creation-preset-save-button"
          disabled={props.disabled || !props.name.trim()}
          onClick={props.onSave}
        >
          {translate('presets.save')}
        </Button>
      </div>
      <Collapsible.Root className="creation-preset-management">
        <Collapsible.Trigger className="creation-preset-manage">
          <Chevron />
          {translate('presets.manage')}
        </Collapsible.Trigger>
        <Collapsible.Panel>
          <div className="creation-preset-actions">
            <Button
              disabled={props.disabled || !props.selectedId || !props.name.trim()}
              onClick={props.onRename}
            >
              {translate('presets.rename')}
            </Button>
            <Button disabled={props.disabled || !props.selectedId} onClick={props.onRemove}>
              {translate('presets.remove')}
            </Button>
            <Button disabled={props.disabled} onClick={props.onExport}>
              {translate('presets.export')}
            </Button>
            <Button disabled={props.disabled} onClick={() => fileInput.current?.click()}>
              {translate('presets.import')}
            </Button>
          </div>
        </Collapsible.Panel>
      </Collapsible.Root>
      <input
        ref={fileInput}
        type="file"
        accept=".json,application/json"
        hidden
        aria-label={translate('presets.import')}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file !== undefined) {
            props.onImport(file);
          }
          event.currentTarget.value = '';
        }}
      />
    </div>
  );
}
