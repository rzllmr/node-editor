
class Connection {
  constructor(startAnchor = null, endAnchor = null) {
    this.slots = {
      start: startAnchor,
      end: endAnchor
    };
  }

  get start() {
    return this.slots.start;
  }

  get end() {
    return this.slots.end;
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
