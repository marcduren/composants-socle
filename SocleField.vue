<!--
  SocleField.vue
  Habillage commun d'un champ de formulaire : label (avec astérisque si requis),
  zone d'erreur annoncée poliment et texte d'aide. Le contrôle lui-même va dans le slot.

  - controlId    : id du contrôle, cible du <label for>.
  - Slot défaut  : reçoit `labelId` (pour aria-labelledby) et `describedBy` (pour aria-describedby).
  - @label-click : clic sur le label, pour les contrôles qui ne doivent pas être activés
                   par ce clic (ex. un <button> : appeler preventDefault() puis donner le focus).
  - Attributs    : class, style et écouteurs non déclarés vont sur le conteneur.

  Prérequis : Vue >= 3.5 (useId), Tailwind CSS v4.
  <SocleField control-id="pseudo" label="Pseudo" :error="err" v-slot="{ describedBy }">
    <textarea id="pseudo" :aria-describedby="describedBy" :aria-invalid="err ? true : undefined" />
  </SocleField>
-->
<script setup lang="ts">
import { computed, ref, useId } from 'vue'

const props = defineProps<{
  /** id du contrôle associé au label. */
  controlId: string
  label?: string
  required?: boolean
  /** Texte d'aide sous le champ (remplacé par `error` si présent). */
  hint?: string
  /** Message d'erreur. */
  error?: string
}>()

const emit = defineEmits<{
  labelClick: [event: MouseEvent]
}>()

defineSlots<{
  default(props: { labelId: string; describedBy: string | undefined }): unknown
}>()

const uid = useId()
const labelId = `${uid}-label`
const hintId = `${uid}-hint`
const errorId = `${uid}-error`

const describedBy = computed(() => (props.error ? errorId : props.hint ? hintId : undefined))

/** Conteneur, exposé pour les tests d'appartenance (focus, clic extérieur). */
const root = ref<HTMLElement | null>(null)
defineExpose({ root })
</script>

<template>
  <div ref="root" class="w-full">
    <label
      v-if="label"
      :id="labelId"
      :for="controlId"
      class="mb-1.5 block text-sm font-medium text-slate-700"
      @click="emit('labelClick', $event)"
    >
      {{ label }}
      <span v-if="required" class="text-red-600" aria-hidden="true">*</span>
    </label>

    <slot :labelId="labelId" :describedBy="describedBy" />

    <!-- Zone d'erreur toujours présente : une région live "polite" doit exister avant que son contenu change.
         Moins intrusif que role="alert", qui interrompt et empile les annonces de tous les champs à l'envoi. -->
    <p :id="errorId" aria-live="polite" class="text-xs text-red-600" :class="{ 'mt-1.5': error }">{{ error }}</p>
    <p v-if="hint && !error" :id="hintId" class="mt-1.5 text-xs text-slate-500">{{ hint }}</p>
  </div>
</template>
