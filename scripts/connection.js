
class Connection {
  constructor(sourceAnchor = null, targetAnchor = null) {
    this.slots = {
      source: sourceAnchor,
      target: targetAnchor
    };
  }

  get source() {
    return this.slots.source;
  }

  get target() {
    return this.slots.target;
  }

  get count() {
    let count = 0;
    for (const key in this.slots) {
      if (this.slots[key] != null) {
        count++;
      }
    }
    return count;
  }

  add(anchor) {
    const freeSlot = this.freeSlot();
    if (freeSlot != null) {
      this.slots[freeSlot] = anchor;
    }
  }

  remove(anchor) {
    for (const key in this.slots) {
      if (this.slots[key] == anchor) {
        this.slots[key] = null;
      }
    }
  }

  other(anchor) {
    const otherSlot = this.otherSlot(anchor);
    return otherSlot == null ? null : this.slots[otherSlot];
  }


  slot(anchor) {
    let slot = null;
    for (const key in this.slots) {
      if (this.slots[key] == anchor) {
        slot = key;
        break;
      }
    }
    return slot;
  }

  otherSlot(anchor) {
    let slot = null;
    for (const key in this.slots) {
      if (this.slots[key] != anchor) {
        slot = key;
        break;
      }
    }
    return slot;
  }

  freeSlot() {
    let slot = null;
    for (const key in this.slots) {
      if (this.slots[key] == null) {
        slot = key;
        break;
      }
    }
    return slot;
  }
}

module.exports = Connection;
