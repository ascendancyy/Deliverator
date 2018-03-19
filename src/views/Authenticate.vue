<template functional>
  <div
    v-once
    :class="$style.authenticate">
    <main :class="$style.modal">
      <h1 :class="$style.title">Authorization Required</h1>
      <p :class="$style.subtitle">{{ props.name }} needs access to Bungie.net.</p>
      <BaseButton
        :href="props.url"
        :class="$style['auth-button']"
        type="primary">
        Authorize
      </BaseButton>
    </main>
  </div>
</template>

<script>
export default {
  name: 'Authenticate',
  props: {
    name: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
};
</script>

<style module lang="scss">
@import '~Snowcrash/_variables.scss';

.authenticate {
  display: flex;
  justify-content: center;
  flex-flow: column nowrap;

  height: 100%;
  padding: 0 16px;

  background-color: $bg-primary;
}

.modal {
  margin: 0 auto;
  max-width: 777px;
  padding: 16px;

  border: 1px solid $bg-white-accent;
  border-radius: $border-radius;
  background-color: $bg-white;
  box-shadow: 0 1px 6px $shadow-color;
}

.title {
  margin: 16px 0;
  font-weight: $font-weight-bold;
  font-size: $font-scale-4;
  line-height: 1;
}

.subtitle {
  margin-top: -12px;
  margin-bottom: 12px;
  padding-bottom: 16px;

  opacity: 0.75;
  border-bottom: 1px solid $bg-white-accent;
}

.auth-button {
  padding: 8px;
  text-decoration: none;
}
</style>
