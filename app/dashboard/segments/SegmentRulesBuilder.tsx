/**
 * Segment Rules Builder
 * UI component for building segment conditions
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { SegmentCondition, SegmentRule } from "@/lib/segments/segment-evaluator";

interface SegmentRulesBuilderProps {
  rules: SegmentRule[];
  onRulesChange: (rules: SegmentRule[]) => void;
}

const FIELD_OPTIONS = [
  { value: "email", label: "Email" },
  { value: "firstName", label: "First Name" },
  { value: "lastName", label: "Last Name" },
  { value: "status", label: "Status" },
];

const OPERATOR_OPTIONS: Record<string, { value: string; label: string }[]> = {
  email: [
    { value: "equals", label: "equals" },
    { value: "contains", label: "contains" },
    { value: "startsWith", label: "starts with" },
    { value: "endsWith", label: "ends with" },
    { value: "isNot", label: "is not" },
  ],
  firstName: [
    { value: "equals", label: "equals" },
    { value: "contains", label: "contains" },
    { value: "startsWith", label: "starts with" },
    { value: "isNot", label: "is not" },
  ],
  lastName: [
    { value: "equals", label: "equals" },
    { value: "contains", label: "contains" },
    { value: "startsWith", label: "starts with" },
    { value: "isNot", label: "is not" },
  ],
  status: [
    { value: "is", label: "is" },
    { value: "isNot", label: "is not" },
  ],
};

const STATUS_OPTIONS = [
  { value: "SUBSCRIBED", label: "Subscribed" },
  { value: "UNSUBSCRIBED", label: "Unsubscribed" },
  { value: "BOUNCED", label: "Bounced" },
  { value: "COMPLAINED", label: "Complained" },
];

export function SegmentRulesBuilder({
  rules,
  onRulesChange,
}: SegmentRulesBuilderProps) {
  const addRule = () => {
    onRulesChange([
      ...rules,
      {
        conditions: [
          {
            field: "email",
            operator: "equals",
            value: "",
          },
        ],
        logic: "AND",
      },
    ]);
  };

  const removeRule = (index: number) => {
    onRulesChange(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, updatedRule: SegmentRule) => {
    const newRules = [...rules];
    newRules[index] = updatedRule;
    onRulesChange(newRules);
  };

  const addCondition = (ruleIndex: number) => {
    const rule = rules[ruleIndex];
    const newCondition: SegmentCondition = {
      field: "email",
      operator: "equals",
      value: "",
    };
    updateRule(ruleIndex, {
      ...rule,
      conditions: [...rule.conditions, newCondition],
    });
  };

  const removeCondition = (ruleIndex: number, conditionIndex: number) => {
    const rule = rules[ruleIndex];
    updateRule(ruleIndex, {
      ...rule,
      conditions: rule.conditions.filter((_, i) => i !== conditionIndex),
    });
  };

  const updateCondition = (
    ruleIndex: number,
    conditionIndex: number,
    updates: Partial<SegmentCondition>
  ) => {
    const rule = rules[ruleIndex];
    const condition = rule.conditions[conditionIndex];
    const updatedCondition = { ...condition, ...updates };
    const newConditions = [...rule.conditions];
    newConditions[conditionIndex] = updatedCondition;
    updateRule(ruleIndex, {
      ...rule,
      conditions: newConditions,
    });
  };

  const updateRuleLogic = (ruleIndex: number, logic: "AND" | "OR") => {
    const rule = rules[ruleIndex];
    updateRule(ruleIndex, { ...rule, logic });
  };

  return (
    <div className="space-y-4">
      {rules.map((rule, ruleIndex) => (
        <Card key={ruleIndex}>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Rule Group {ruleIndex + 1}
                </Label>
                <div className="flex items-center gap-2">
                  {rules.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRule(ruleIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {rule.conditions.map((condition, conditionIndex) => (
                <div
                  key={conditionIndex}
                  className="flex items-end gap-2 p-3 border rounded-md bg-muted/50"
                >
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Field</Label>
                      <Select
                        value={condition.field}
                        onValueChange={(value) =>
                          updateCondition(ruleIndex, conditionIndex, {
                            field: value,
                            operator: (OPERATOR_OPTIONS[value]?.[0]?.value || "equals") as SegmentCondition["operator"],
                            value: condition.field === "status" ? condition.value : "",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_OPTIONS.map((field) => (
                            <SelectItem key={field.value} value={field.value}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Operator</Label>
                      <Select
                        value={condition.operator}
                        onValueChange={(value) =>
                          updateCondition(ruleIndex, conditionIndex, {
                            operator: value as any,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OPERATOR_OPTIONS[condition.field]?.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Value</Label>
                      {condition.field === "status" ? (
                        <Select
                          value={String(condition.value)}
                          onValueChange={(value) =>
                            updateCondition(ruleIndex, conditionIndex, {
                              value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={String(condition.value || "")}
                          onChange={(e) =>
                            updateCondition(ruleIndex, conditionIndex, {
                              value: e.target.value,
                            })
                          }
                          placeholder="Enter value..."
                        />
                      )}
                    </div>
                  </div>

                  {rule.conditions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCondition(ruleIndex, conditionIndex)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addCondition(ruleIndex)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Condition
                </Button>

                {rule.conditions.length > 1 && (
                  <div className="flex items-center gap-2 ml-auto">
                    <Label className="text-xs">Match:</Label>
                    <select
                      value={rule.logic || "AND"}
                      onChange={(e) =>
                        updateRuleLogic(ruleIndex, e.target.value as "AND" | "OR")
                      }
                      className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                    >
                      <option value="AND">All (AND)</option>
                      <option value="OR">Any (OR)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button type="button" variant="outline" onClick={addRule} className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        Add Rule Group
      </Button>
    </div>
  );
}

