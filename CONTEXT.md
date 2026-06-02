# Better Gradient

Better Gradient is an editor for creating mesh-gradient compositions that can be shared or exported as image and CSS assets.

## Language

**Canvas Background**:
The base surface behind the gradient shapes, either a solid color or transparent.
_Avoid_: First color, backdrop

**Palette Color**:
A reusable color that can be assigned to gradient shapes.
_Avoid_: Background color

**Grain**:
A visual texture effect applied to a gradient composition.
_Avoid_: Noise, background texture

## Relationships

- A **Canvas Background** belongs to exactly one gradient composition
- A transparent **Canvas Background** may retain a solid fallback color for later reuse
- A **Palette Color** may be used by zero or more gradient shapes
- A transparent **Canvas Background** does not remove any **Palette Color**
- A transparent export may either keep or suppress **Grain**
- Transparent exports suppress **Grain** by default unless the user explicitly keeps it
- When the palette changes, the solid **Canvas Background** color follows the first **Palette Color**

## Example Dialogue

> **Dev:** "If the user chooses a transparent **Canvas Background**, do we remove the first **Palette Color**?"
> **Domain expert:** "No. The **Canvas Background** changes, but the **Palette Color** remains available for shapes."
>
> **Dev:** "If a transparent export has **Grain** enabled, should empty pixels stay fully transparent?"
> **Domain expert:** "Ask at export time whether to keep the **Grain** or suppress it."

## Flagged Ambiguities

- "background" previously meant both the first palette color and the exported canvas surface; resolved: **Canvas Background** is separate from **Palette Color**.
